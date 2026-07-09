/**
 * lib/airtable.ts — 서버 사이드 전용 (API Key 클라이언트 노출 금지)
 * 추후 Supabase 이전 시 이 파일만 교체하면 됩니다.
 */

import Airtable from "airtable";
import type { Artist, Work, ArtistField, ArtistType, ArtistFilter } from "@/types";

// ── 환경변수 ──────────────────────────────────────────────────────
const API_KEY     = process.env.AIRTABLE_API_KEY        ?? "";
const BASE_ID     = process.env.AIRTABLE_BASE_ID        ?? "";
const ARTISTS_TBL = process.env.AIRTABLE_ARTISTS_TABLE  ?? "Artists";
const WORKS_TBL       = process.env.AIRTABLE_WORKS_TABLE       ?? "Works";
const SUBMISSIONS_TBL = process.env.AIRTABLE_SUBMISSIONS_TABLE ?? "Submissions";

// ── Lazy 클라이언트 (빌드 타임 에러 방지) ─────────────────────────
let _base: ReturnType<InstanceType<typeof Airtable>["base"]> | null = null;
function getBase() {
  if (!_base) {
    if (!API_KEY) throw new Error("AIRTABLE_API_KEY가 설정되지 않았습니다.");
    if (!BASE_ID) throw new Error("AIRTABLE_BASE_ID가 설정되지 않았습니다.");
    _base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);
  }
  return _base;
}

// ── 유틸 ─────────────────────────────────────────────────────────
const getString = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getNumber = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
};

const getArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map(v => v.trim()).filter(Boolean);
  }
  return [];
};

// ── record → Artist ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toArtist(record: any): Artist {
  const f = record.fields;
  return {
    recordId:                    getString(record.id),                    // rec... Airtable 내부 ID
    id:                          getString(f.id) || record.id,  // fields.id (works 매칭용)
    name:                        getString(f.name),
    name_en:                     getString(f.name_en),
    type:                        (getString(f.type) as ArtistType) || "individual",
    field:                       (getString(f.field) as ArtistField) || "unknown",
    bio_short:                   getString(f.bio_short),
    representative_work:         getString(f.representative_work),
    year:                        getNumber(f.year),
    organization_or_affiliation: getString(f.organization_or_affiliation),
    festival_or_venue:           getString(f.festival_or_venue),
    city_or_region:              getString(f.city_or_region),
    website_url:                 getString(f.website_url) || null,
    instagram_url:               getString(f.instagram_url) || null,
    video_url:                   getString(f.video_url) || null,
    photo_url:                   getString(f.photo_url) || null,
    source_file:                 getString(f.source_file),
    tags:                        getArray(f.tags),
    verification_status:         (getString(f.verification_status) as Artist["verification_status"]) || "needs_review",
    works:                       f.works ? getArray(f.works) : [],
    aiSummary:                   getString(f.aiSummary || f['AI summary']),
    reviews:                     [],
    created_at:                  getString(f.created_at),
    updated_at:                  getString(f.updated_at),
  };
}

// ── record → Work ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWork(record: any): Work {
  const f = record.fields;
  
  // artistRecordIds: Artist 또는 artist 또는 artist_id 등이 linked record 배열일 수 있음
  const artistRecordIds = Array.isArray(f.Artist) 
    ? f.Artist.map(String) 
    : Array.isArray(f.artist) 
      ? f.artist.map(String) 
      : Array.isArray(f.artist_id) 
        ? f.artist_id.map(String) 
        : [];

  return {
    id:          getString(record.id),
    artist_id:   getString(
      f.artist_id ||
      f.artistId ||
      f["artist_id"] ||
      f["Artist ID"] ||
      f["Artist"] ||
      ""
    ),
    artist_name: getString(
      f.artist_name ||
      f["artist_name"] ||
      f["Artist Name"] ||
      f["Artist"] ||
      f["name"] ||
      ""
    ),
    title:       getString(
      f.title ||
      f["title"] ||
      f["Title"] ||
      f["work_title"] ||
      f["Work Title"] ||
      ""
    ),
    year:        getNumber(f.year || f["Year"] || f.work_year || f["Work Year"]),
    role:        getString(f.role || f["Role"] || f["역할"]),
    venue:       getString(f.venue || f["Venue"] || f["장소"]),
    festival:    getString(f.festival || f["Festival"] || f["축제"]),
    source_url:  getString(f.source_url || f["Source URL"] || f.url || f["URL"] || f.link || f["Link"]),
    artistRecordIds,
  };
}

// ── 페이지네이션 fetch ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(table: string, opts: Record<string, any> = {}): Promise<any[]> {
  const records: unknown[] = [];
  await getBase()(table)
    .select({ pageSize: 100, ...opts })
    .eachPage((page, next) => {
      records.push(...page);
      next();
    });
  return records;
}

// ══════════════════════════════════════════════════════════════════
// Public API
// ══════════════════════════════════════════════════════════════════

/** 전체 아티스트 목록 */
export async function getArtists(): Promise<Artist[]> {
  const records = await fetchAll(ARTISTS_TBL, {
    sort: [{ field: "name", direction: "asc" }],
  });
  return records.map(toArtist);
}

/**
 * 아티스트 단건 조회
 * 먼저 Airtable record ID로 직접 조회(find)하고,
 * 실패하거나 없을 경우 fields.id로 fallback 조회(formula)를 수행합니다.
 * 둘 다 조회에 실패하면 null을 반환하고, API 상에서 실제 에러 발생 시 throw 합니다.
 */
export async function getArtistById(id: string): Promise<Artist | null> {
  let findError: any = null;

  // 1) Airtable record ID (rec...) — .find() 로 직접 조회 시도
  try {
    const record = await getBase()(ARTISTS_TBL).find(id);
    if (record) return toArtist(record);
  } catch (e: any) {
    findError = e;
    console.warn(`[airtable] record.find("${id}") 실패, fallback 시도:`, e.message || e);
  }

  // 2) fields.id (김경숙-b0431df7 등) — formula 조회 시도
  try {
    const escaped = id.replace(/'/g, "\\'");
    const records = await fetchAll(ARTISTS_TBL, {
      filterByFormula: `{id} = '${escaped}'`,
      maxRecords: 1,
    });
    if (records.length) return toArtist(records[0]);
  } catch (e: any) {
    console.error(`[airtable] filterByFormula id="${id}" 에러 발생:`, e);
    throw new Error(`Airtable 조회 실패 (find error: ${findError?.message || findError}, fallback error: ${e.message || e})`);
  }

  return null;
}

/** 전체 작품 목록 */
export async function getWorks(): Promise<Work[]> {
  const records = await fetchAll(WORKS_TBL, {
    sort: [{ field: "year", direction: "desc" }],
  });
  return records.map(toWork);
}

/**
 * 특정 아티스트의 작품 목록
 * Works 테이블에서 artist_id 또는 artist_name, artistRecordIds 등을 기준으로 자바스크립트 필터링을 수행합니다.
 * (Airtable INVALID_FILTER_BY_FORMULA 방지)
 */
export async function getWorksByArtistId(artistId: string): Promise<Work[]> {
  // 1) 아티스트 정보 먼저 조회 시도
  let artist: Artist | null = null;
  try {
    artist = await getArtistById(artistId);
  } catch (err) {
    console.warn(`[getWorksByArtistId] 아티스트 정보를 가져오지 못했습니다. artistId="${artistId}":`, err);
  }

  // 2) 전체 Works 목록을 긁어옴
  const allWorks = await getWorks();

  // 3) 메모리 필터링 적용
  return allWorks.filter((work) => {
    if (artist) {
      return (
        work.artist_name === artist.name ||
        work.artist_name === artist.id ||
        work.artist_id === artist.id ||
        work.artist_id === artist.recordId ||
        (work.artistRecordIds && work.artistRecordIds.includes(artist.recordId || ""))
      );
    } else {
      // artist를 못 찾은 경우 id 기준 매칭으로 fallback
      return (
        work.artist_id === artistId ||
        work.artist_name === artistId ||
        (work.artistRecordIds && work.artistRecordIds.includes(artistId))
      );
    }
  });
}

/** 텍스트 검색 + 타입/분야 필터 */
export async function searchArtists(filter: ArtistFilter): Promise<Artist[]> {
  const formulas: string[] = [];

  if (filter.type && filter.type !== "all")
    formulas.push(`{type} = "${filter.type}"`);
  if (filter.field && filter.field !== "all")
    formulas.push(`{field} = "${filter.field}"`);
  if (filter.query?.trim()) {
    const q = filter.query.trim().replace(/"/g, "");
    formulas.push(
      `OR(SEARCH("${q}",LOWER({name})),SEARCH("${q}",LOWER({name_en})),SEARCH("${q}",LOWER({representative_work})),SEARCH("${q}",LOWER({tags})))`
    );
  }

  const filterByFormula =
    formulas.length === 0 ? "" :
    formulas.length === 1 ? formulas[0] :
    `AND(${formulas.join(",")})`;

  const opts: Record<string, unknown> = { sort: [{ field: "name", direction: "asc" }] };
  if (filterByFormula) opts.filterByFormula = filterByFormula;

  const records = await fetchAll(ARTISTS_TBL, opts);
  return records.map(toArtist);
}

export async function filterArtists(filter: Omit<ArtistFilter, "query">): Promise<Artist[]> {
  return searchArtists(filter);
}

// ── Submission 타입 ───────────────────────────────────────────────
export interface SubmissionInput {
  name: string;
  email: string;
  instagram: string;
  website: string;
  bio: string;
  works: string;
  portfolio_url: string;
}

/**
 * Submissions 테이블에 신청 데이터 저장
 * Artists 테이블에는 저장하지 않음 — 관리자가 검토 후 수동 이전
 */
export async function createSubmission(data: SubmissionInput): Promise<{ id: string }> {
  const bioWithMeta = `이메일: ${data.email.trim()}\n포트폴리오: ${data.portfolio_url.trim()}\n\n소개:\n${data.bio.trim()}`;
  const record = await getBase()(SUBMISSIONS_TBL).create({
    Name:          data.name.trim(),
    Instagram:     data.instagram.trim(),
    Website:       data.website.trim(),
    Bio:           bioWithMeta,
    Works:         data.works.trim(),
    Status:        "pending",
  });
  return { id: record.id };
}

// ── Admin Submissions Helpers ─────────────────────────────────────
export interface Submission {
  id: string;
  name: string;
  email: string;
  instagram: string;
  website: string;
  bio: string;
  works: string;
  portfolio_url: string;
  status: string;
  submitted_at: string;
}

export async function getSubmissions(): Promise<Submission[]> {
  const records = await fetchAll(SUBMISSIONS_TBL);
  
  // Sort in JS memory by createdTime desc to avoid Airtable sort errors
  records.sort((a: any, b: any) => {
    const tA = a.createdTime || "";
    const tB = b.createdTime || "";
    return tB.localeCompare(tA);
  });

  return records.map((record: any) => {
    const f = record.fields;
    const bioText = getString(f.Bio || f.bio);
    
    let email = "";
    let portfolioUrl = "";
    let cleanBio = bioText;

    const emailMatch = bioText.match(/이메일:\s*([^\n]+)/);
    if (emailMatch) email = emailMatch[1].trim();

    const portfolioMatch = bioText.match(/포트폴리오:\s*([^\n]+)/);
    if (portfolioMatch) portfolioUrl = portfolioMatch[1].trim();

    const bioSplit = bioText.split("\n\n소개:\n");
    if (bioSplit.length > 1) {
      cleanBio = bioSplit.slice(1).join("\n\n소개:\n");
    }

    return {
      id:            getString(record.id),
      name:          getString(f.Name || f.name),
      email:         email || getString(f.email),
      instagram:     getString(f.Instagram || f.instagram),
      website:       getString(f.Website || f.website),
      bio:           cleanBio,
      works:         getString(f.Works || f.works),
      portfolio_url: portfolioUrl || getString(f.portfolio_url),
      status:        getString(f.Status || f.status) || "pending",
      submitted_at:  record.createdTime || "",
    };
  });
}

export async function updateSubmissionStatus(id: string, status: string): Promise<void> {
  await getBase()(SUBMISSIONS_TBL).update(id, {
    Status: status
  });
}

export async function updateSubmission(id: string, fields: Partial<SubmissionInput>): Promise<void> {
  // Read current record to preserve metadata fields not being updated
  const record = await getBase()(SUBMISSIONS_TBL).find(id);
  const f = record.fields;
  const bioText = getString(f.Bio || f.bio);

  let currentEmail = "";
  let currentPortfolio = "";
  let currentBio = bioText;

  const emailMatch = bioText.match(/이메일:\s*([^\n]+)/);
  if (emailMatch) currentEmail = emailMatch[1].trim();

  const portfolioMatch = bioText.match(/포트폴리오:\s*([^\n]+)/);
  if (portfolioMatch) currentPortfolio = portfolioMatch[1].trim();

  const bioSplit = bioText.split("\n\n소개:\n");
  if (bioSplit.length > 1) {
    currentBio = bioSplit.slice(1).join("\n\n소개:\n");
  }

  // Override with new values if present
  const name = fields.name !== undefined ? fields.name.trim() : getString(f.Name || f.name);
  const email = fields.email !== undefined ? fields.email.trim() : currentEmail;
  const instagram = fields.instagram !== undefined ? fields.instagram.trim() : getString(f.Instagram || f.instagram);
  const website = fields.website !== undefined ? fields.website.trim() : getString(f.Website || f.website);
  const works = fields.works !== undefined ? fields.works.trim() : getString(f.Works || f.works);
  const portfolio_url = fields.portfolio_url !== undefined ? fields.portfolio_url.trim() : currentPortfolio;
  const bio = fields.bio !== undefined ? fields.bio.trim() : currentBio;

  const bioWithMeta = `이메일: ${email}\n포트폴리오: ${portfolio_url}\n\n소개:\n${bio}`;

  await getBase()(SUBMISSIONS_TBL).update(id, {
    Name: name,
    Instagram: instagram,
    Website: website,
    Works: works,
    Bio: bioWithMeta
  });
}

export async function createArtistFromSubmission(data: {
  name: string;
  company?: string;
  works: string[];
  field?: string;
  genre?: string;
  instagram?: string;
  website?: string;
}): Promise<{ id: string }> {
  // Format works as "<Work1>, <Work2>" for Role column compatibility
  const roleValue = data.works.map(w => `<${w.trim()}>`).join(", ");
  
  // Format Genre as array
  const genreValue = [data.field || "dance", data.genre || "contemporary"].filter(Boolean);

  const fields: Record<string, any> = {
    Name: data.name.trim(),
    Company: (data.company ?? "").trim(),
    Role: roleValue,
    Genre: genreValue,
    "Attachment Summary": (data.instagram || data.website || "").trim(),
  };

  const record = await getBase()(ARTISTS_TBL).create(fields);
  return { id: record.id };
}

