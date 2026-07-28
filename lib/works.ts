// Single source of truth for work item shapes, image normalization, and credits.
// Shared by both individual artists and company pages across self-serve CMS,
// admin editors, API routes, public detail pages, and modals.

export interface WorkCredit {
  role: string;
  names: string[];
}

export interface NormalizedWork {
  id: string;
  title: string;
  year: string;
  description: string;
  role?: string;
  image_url: string;
  images: string[];
  video_url: string;
  credits: WorkCredit[];
  dashboard_image_order?: string[];
  sort_order?: number;
}

/**
 * Resolves a work's images regardless of which editor last touched it:
 * `images[]` (canonical) first, then legacy `image_url`/`image` wrapped into
 * an array. Dedupes, drops empty strings, caps at 8 (the max UI supports).
 */
export function normalizeWorkImages(work: any): string[] {
  let raw: any[] = [];

  if (Array.isArray(work?.images) && work.images.length > 0) {
    raw = [...work.images];
  } else if (typeof work?.images === "string" && work.images.trim().startsWith("[")) {
    try {
      raw = JSON.parse(work.images);
    } catch {
      raw = [work.images];
    }
  }

  if (work?.image_url) raw.push(work.image_url);
  if (work?.image) raw.push(work.image);
  if (work?.media?.src) raw.push(work.media.src);
  if (Array.isArray(work?.gallery)) raw.push(...work.gallery);

  const cleaned = raw
    .map((img: any) => (typeof img === "string" ? img.trim() : (img?.url || img?.src || "").trim()))
    .filter(Boolean);

  return Array.from(new Set(cleaned)).slice(0, 8);
}

/**
 * Resolves a work's credits into a role-grouped structured array.
 */
export function normalizeWorkCredits(work: any): WorkCredit[] {
  const roleMap = new Map<string, string[]>();

  const addPerson = (roleName: string, nameVal: string) => {
    const role = (roleName || "").trim();
    const name = (nameVal || "").trim();
    if (!role || !name) return;
    if (!roleMap.has(role)) roleMap.set(role, []);
    const list = roleMap.get(role)!;
    if (!list.includes(name)) list.push(name);
  };

  if (Array.isArray(work?.credits_list) && work.credits_list.length > 0) {
    work.credits_list.forEach((item: any) => {
      if (item && item.role && item.name) addPerson(item.role, item.name);
    });
  } else if (Array.isArray(work?.credits) && work.credits.length > 0) {
    work.credits.forEach((item: any) => {
      if (item && typeof item === "object") {
        const role = item.role || "역할";
        if (Array.isArray(item.names)) {
          item.names.forEach((n: any) => addPerson(role, String(n)));
        } else if (typeof item.name === "string") {
          item.name.split(/[,;&]/).forEach((n: string) => addPerson(role, n));
        }
      }
    });
  } else if (typeof work?.credits === "string" && work.credits.trim()) {
    const rawCredits = work.credits
      .replace(/[•*·]/g, "\n")
      .replace(/\r/g, "")
      .trim();
    const lines = rawCredits.split(/\n+/).map((line: string) => line.trim()).filter(Boolean);
    const knownRoles = [
      "공동창작 및 출연", "공동창작", "출연", "인터뷰", "연출", "안무", "기획", "제작",
      "음악", "작곡", "연주", "무대", "조명", "의상", "영상", "사진", "디자인", "드라마투르그",
      "director", "choreography", "performer", "cast", "interview", "music", "lighting", "costume", "photo"
    ];
    const rolePattern = new RegExp("(" + knownRoles.join("|") + ")\\s*(?:[:：=-]\\s*)?", "gi");

    lines.forEach((line: string) => {
      const explicit = line.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
      if (explicit) {
        explicit[2].split(/[,;&/]|\s+및\s+/).forEach((name) => addPerson(explicit[1], name));
        return;
      }

      const matches = Array.from(line.matchAll(rolePattern));
      if (matches.length > 0) {
        matches.forEach((match, index) => {
          const role = match[1];
          const contentStart = (match.index || 0) + match[0].length;
          const contentEnd = index + 1 < matches.length ? matches[index + 1].index : line.length;
          const names = line.slice(contentStart, contentEnd).replace(/^[,;·.\s-]+|[,;·.\s-]+$/g, "");
          if (names) names.split(/[,;&/]|\s+및\s+/).forEach((name) => addPerson(role, name));
        });
        const prefix = line.slice(0, matches[0].index || 0).trim();
        if (prefix) addPerson("크레딧", prefix);
        return;
      }

      addPerson("크레딧", line);
    });
  } else if (work?.role) {
    addPerson("안무/역할", work.role);
  }

  return Array.from(roleMap.entries()).map(([role, names]) => ({ role, names }));
}

export function creditsToDisplayString(work: any): string {
  const structured = normalizeWorkCredits(work);
  if (structured.length === 0) return "";
  return structured.map((c) => `${c.role}: ${c.names.join(", ")}`).join("\n");
}

/**
 * Read-only normalization for display and GET queries.
 * Does NOT filter out works that have images or description even if title is empty.
 */
export function normalizeWork(work: any): NormalizedWork {
  const images = normalizeWorkImages(work);
  const imageUrl = images[0] || (typeof work?.image_url === "string" ? work.image_url.trim() : "");
  return {
    id: work?.id ? String(work.id) : "",
    title: (work?.title || "").trim(),
    year: work?.year ? String(work.year).trim() : "",
    role: work?.role ? String(work.role).trim() : "",
    description: work?.description ? String(work.description).trim() : "",
    video_url: work?.video_url ? String(work.video_url).trim() : (work?.videoUrl || work?.video || ""),
    images,
    image_url: imageUrl,
    credits: normalizeWorkCredits(work),
    dashboard_image_order: Array.isArray(work?.dashboard_image_order) ? work.dashboard_image_order.filter((url: unknown): url is string => typeof url === "string" && Boolean(url.trim())) : undefined,
    sort_order: Number.isFinite(Number(work?.sort_order)) ? Number(work.sort_order) : undefined,
  };
}

export function normalizeWorks(works: any): NormalizedWork[] {
  return (Array.isArray(works) ? works : []).map(normalizeWork);
}

let fallbackIdCounter = 0;

/**
 * Canonical on-write cleanup payload generator.
 * Filters out ONLY completely empty work rows (no title, description, role, video, images, or credits).
 */
export function cleanWorkForPayload(work: any): NormalizedWork | null {
  const title = (work?.title || "").trim();
  const year = work?.year ? String(work.year).trim() : "";
  const role = work?.role ? String(work.role).trim() : "";
  const description = work?.description ? String(work.description).trim() : "";
  const video_url = work?.video_url ? String(work.video_url).trim() : (work?.videoUrl || work?.video || "").trim();
  const images = normalizeWorkImages(work);
  const credits = normalizeWorkCredits(work);
  const dashboard_image_order = Array.isArray(work?.dashboard_image_order) ? work.dashboard_image_order.filter((url: unknown): url is string => typeof url === "string" && Boolean(url.trim())) : undefined;
  const sort_order = Number.isFinite(Number(work?.sort_order)) ? Number(work.sort_order) : undefined;

  const hasContent = Boolean(title) || Boolean(description) || Boolean(role) || Boolean(video_url) || images.length > 0 || credits.length > 0;
  if (!hasContent) return null;

  const id = work?.id ? String(work.id) : `work_${Date.now()}_${fallbackIdCounter++}`;
  const image_url = images[0] || "";

  return {
    id,
    title,
    year,
    role,
    description,
    video_url,
    images,
    image_url,
    credits,
    dashboard_image_order,
    sort_order,
  };
}

/** Uses an explicit saved order when present; otherwise defaults to newest year first. */
export function sortWorksForDisplay<T extends { year?: unknown; sort_order?: unknown }>(works: T[]): T[] {
  const list = [...works];
  const hasSavedOrder = list.some((work) => Number.isFinite(Number(work?.sort_order)));
  return list
    .map((work, index) => ({ work, index }))
    .sort((a, b) => {
      if (hasSavedOrder) {
        const aOrder = Number.isFinite(Number(a.work.sort_order)) ? Number(a.work.sort_order) : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(Number(b.work.sort_order)) ? Number(b.work.sort_order) : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder || a.index - b.index;
      }
      const aYear = Number.parseInt(String(a.work.year || ""), 10);
      const bYear = Number.parseInt(String(b.work.year || ""), 10);
      return (Number.isFinite(bYear) ? bYear : -Infinity) - (Number.isFinite(aYear) ? aYear : -Infinity) || a.index - b.index;
    })
    .map(({ work }) => work);
}

/** Persists the current drag-and-drop order directly on each work item. */
export function applyWorkSortOrder<T extends object>(works: T[]): Array<T & { sort_order: number }> {
  return works.map((work, index) => ({ ...work, sort_order: index }));
}

export function cleanWorksForPayload(works: any): NormalizedWork[] {
  return (Array.isArray(works) ? works : [])
    .map(cleanWorkForPayload)
    .filter((w): w is NormalizedWork => w !== null);
}
