// Single source of truth for the `companies.works` JSONB item shape, shared by
// every reader/writer of company works: the self-serve CMS (CompanyCmsEditor),
// the POPOK-admin editor (app/admin/companies/[id]/page.tsx), the public
// portfolio grid + WorkDrawer, and both save routes (companies/[id]/update and
// admin/companies/[id]). Whichever screen saves last, the persisted shape must
// always be the same:
//
//   { id, title, year, description, video_url, images: string[], credits: [{role, names[]}] }
//
// Never `image` / `image_url` (legacy single-image fields) or a string `credits`
// — those are read-compat only, normalized away on every write.

export interface WorkCredit {
  role: string;
  names: string[];
}

export interface NormalizedWork {
  id: string;
  title: string;
  year: string;
  description: string;
  video_url: string;
  images: string[];
  credits: WorkCredit[];
}

/**
 * Resolves a work's images regardless of which editor last touched it:
 * `images[]` (canonical) first, then legacy `image_url`/`image` wrapped into
 * a single-element array. Read-compat only — the output here is what should
 * be *displayed*; only `cleanWorkForPayload`'s output should ever be *saved*.
 * Dedupes, drops empty strings, caps at 4 (the max the UI supports).
 */
export function normalizeWorkImages(work: any): string[] {
  let raw: any[] = [];

  if (Array.isArray(work?.images) && work.images.length > 0) {
    raw = [...work.images];
  } else if (typeof work?.images === "string" && work.images.trim().startsWith("[")) {
    // Very old rows occasionally have `images` stored as a JSON-encoded string
    // rather than an actual array — WorkDrawer already tolerated this.
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

  return Array.from(new Set(cleaned)).slice(0, 4);
}

/**
 * Resolves a work's credits into a role-grouped structured array, regardless
 * of source shape. Priority order matters:
 *   1. `credits_list` — the CMS editor's live per-row state (role/name pairs).
 *      Only ever present transiently in the CMS's own React state, never
 *      persisted — but when present it's the freshest source, so it wins
 *      even if a stale `credits` array is also sitting on the same object.
 *   2. `credits` as a structured array — the canonical persisted shape
 *      (`[{role, names[]}]` or `[{role, name}]`), what every other reader
 *      (admin, public page) actually sees.
 *   3. `credits` as a legacy "role: name" string (one per line).
 *   4. a bare `work.role` string, as a last resort.
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
    work.credits.split("\n").forEach((line: string) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const role = parts[0];
        parts.slice(1).join(":").split(/[,;&]/).forEach((n) => addPerson(role, n));
      } else if (line.includes(",")) {
        // No top-level "role:" but comma-separated — could be a bare name list
        // ("김철수, 이영희") or comma-joined "role:name" pairs on one line.
        line.split(",").forEach((segment) => {
          const segParts = segment.split(":");
          if (segParts.length >= 2) {
            addPerson(segParts[0], segParts.slice(1).join(":"));
          } else if (segment.trim()) {
            addPerson("크레딧", segment);
          }
        });
      } else if (line.trim()) {
        addPerson("크레딧", line);
      }
    });
  } else if (work?.role) {
    addPerson("안무/역할", work.role);
  }

  return Array.from(roleMap.entries()).map(([role, names]) => ({ role, names }));
}

/** Formats a work's credits back into editable "role: name, name2" lines — the
 * inverse of the string-parsing branch of normalizeWorkCredits, used by any
 * plain-textarea credits editor (the admin page) so a structured array saved
 * by the CMS still displays sensibly there instead of `[object Object]`. */
export function creditsToDisplayString(work: any): string {
  const structured = normalizeWorkCredits(work);
  if (structured.length === 0) return "";
  return structured.map((c) => `${c.role}: ${c.names.join(", ")}`).join("\n");
}

let fallbackIdCounter = 0;

/** Canonical on-write shape. The only thing any save path should ever persist
 * into `companies.works`. */
export function cleanWorkForPayload(work: any): NormalizedWork {
  const id = work?.id ? String(work.id) : `work_${Date.now()}_${fallbackIdCounter++}`;
  return {
    id,
    title: (work?.title || "").trim(),
    year: work?.year ? String(work.year).trim() : "",
    description: work?.description ? String(work.description).trim() : "",
    video_url: work?.video_url ? String(work.video_url).trim() : "",
    images: normalizeWorkImages(work),
    credits: normalizeWorkCredits(work),
  };
}

export function cleanWorksForPayload(works: any): NormalizedWork[] {
  return (Array.isArray(works) ? works : []).map(cleanWorkForPayload);
}
