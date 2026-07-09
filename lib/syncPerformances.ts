import fs from "fs";
import path from "path";
import https from "https";
import { getSupabaseServer } from "./supabaseServer";

// Helper to convert comma/newline-separated strings to array
function parseStringToArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/,|\n|;/)
      .map(v => v.replace(/[<>\u3008\u3009]/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

// Slugify function for fallback ID
function slugify(name: string, recordId?: string): string {
  let clean = name.replace(/[^\w가-힣\s-]/g, '').trim();
  clean = clean.replace(/[\s\t]+/g, '-');
  const suffix = recordId ? recordId.substring(recordId.length - 8) : Math.random().toString(36).substring(2, 6);
  return `${clean}-${suffix}`.toLowerCase();
}

import http from "http";

// Download helper using http/https (with redirect, timeout and protocol support)
function downloadFile(
  url: string,
  destPath: string,
  timeoutMs: number = 10000,
  maxRedirects: number = 5
): Promise<void> {
  return new Promise((resolve, reject) => {
    const trimmedUrl = (url || "").trim();
    if (!trimmedUrl) {
      return reject(new Error("URL is empty"));
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch (e: any) {
      return reject(new Error(`Invalid URL format: ${trimmedUrl}`));
    }

    const protocol = parsedUrl.protocol;
    if (protocol !== "http:" && protocol !== "https:") {
      return reject(new Error(`Unsupported protocol: ${protocol}`));
    }

    const client = protocol === "https:" ? https : http;
    const tempPath = destPath + ".tmp";
    const file = fs.createWriteStream(tempPath);
    let isFinished = false;

    const cleanupAndReject = (err: Error) => {
      if (isFinished) return;
      isFinished = true;
      file.close();
      fs.unlink(tempPath, () => {});
      reject(err);
    };

    file.on("error", (err) => {
      cleanupAndReject(err);
    });

    const requestOptions = {
      timeout: timeoutMs,
    };

    const req = client.get(trimmedUrl, requestOptions, (response) => {
      const statusCode = response.statusCode || 0;

      // Follow redirect
      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        const location = response.headers.location;
        if (!location) {
          cleanupAndReject(new Error(`Redirect status ${statusCode} received, but location header is missing`));
          return;
        }

        if (maxRedirects <= 0) {
          cleanupAndReject(new Error("Max redirect limit reached"));
          return;
        }

        let redirectUrl: string;
        try {
          redirectUrl = new URL(location, trimmedUrl).toString();
        } catch (e: any) {
          cleanupAndReject(new Error(`Failed to parse redirect location: ${location}`));
          return;
        }

        file.close();
        fs.unlink(tempPath, () => {});
        isFinished = true;

        downloadFile(redirectUrl, destPath, timeoutMs, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (statusCode !== 200) {
        cleanupAndReject(new Error(`Failed to download: HTTP ${statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        if (!isFinished) {
          isFinished = true;
          file.close(() => {
            try {
              fs.renameSync(tempPath, destPath);
              resolve();
            } catch (renameErr: any) {
              reject(renameErr);
            }
          });
        }
      });
    });

    req.on('error', (err) => {
      cleanupAndReject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      cleanupAndReject(new Error(`Request timeout (${timeoutMs}ms)`));
    });
  });
}

export interface SyncPerformancesResult {
  success: boolean;
  totalRecords: number;
  savedPerformances: number;
  lastSync: string;
}

export interface DbPerformanceRow {
  id: string | number;
  title: string;
  slug?: string | null;
  external_id?: string | null;
  company?: string | null;
  venue?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  ticket_url?: string | null;
  description?: string | null;
  source?: string | null;
  artist_id?: string | number | null;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  genre?: string | null;
  hosts?: string | null;
  organizers?: string | null;
  cast_members?: string | null;
  director?: string | null;
  instagram_url?: string | null;
  external_links?: string | null;
  submitted_by?: string | null;
}

export async function syncPerformancesFromAirtable(): Promise<SyncPerformancesResult> {
  if (process.env.VERCEL === "1") {
    throw new Error("Vercel production environment is read-only. Database to file synchronization is not allowed.");
  }

  // 1. Fetch performances from Supabase
  const { data: dbRecords, error } = await (getSupabaseServer().from("performances") as unknown as {
    select: (columns: string) => Promise<{ data: DbPerformanceRow[] | null; error: any }>
  })
    .select("*");

  if (error) {
    throw new Error(`Supabase performances 테이블 조회 실패: ${error.message}`);
  }

  // 2. Fetch all artists from Supabase to construct UUID -> Slug mapping
  const { data: dbArtists, error: artistsErr } = await (getSupabaseServer().from("artists") as unknown as {
    select: (columns: string) => Promise<{ data: Array<{ id: string; slug: string | null }> | null; error: any }>
  })
    .select("id, slug");

  const artistMap: Record<string, string> = {};
  if (!artistsErr && dbArtists) {
    dbArtists.forEach(a => {
      if (a.id && a.slug) {
        artistMap[a.id] = a.slug;
      }
    });
  }

  const outputDir = path.join(process.cwd(), 'data');
  const imagesDir = path.join(process.cwd(), 'public/images/performances');

  // Ensure directories exist
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  // JSON 보호 가드: Supabase 데이터가 아예 비어있으면 덮어쓰지 않고 중단
  if (!dbRecords || dbRecords.length === 0) {
    throw new Error("❌ 동기화 중단: Supabase performances 테이블이 비어있습니다. 기존 JSON 캐시를 보호합니다.");
  }

  // 기존 JSON 로드
  const performancesPath = path.join(outputDir, 'performances.json');
  let existingPerformances: any[] = [];
  if (fs.existsSync(performancesPath)) {
    try {
      existingPerformances = JSON.parse(fs.readFileSync(performancesPath, 'utf8'));
    } catch (e) {
      console.warn("기존 performances.json 읽기 실패, 신규 비교 패스:", e);
    }
  }

  const performances: any[] = [];

  for (const record of dbRecords) {
    const title = (record.title || '').trim();
    if (!title) continue;

    const recordId = record.external_id ? String(record.external_id) : ''; // 기존 Airtable recordId 역할
    const dbId = record.id; // UUID

    // JSON 보호 가드: 기존에 존재하는 항목인지 비교하고, 기존 항목인데 Supabase slug가 없으면 중단
    const matchedExisting = existingPerformances.find(ep => ep.recordId !== undefined && String(ep.recordId) === recordId);
    let id = record.slug ? record.slug.trim() : '';

    if (matchedExisting && !id) {
      throw new Error(`❌ 동기화 중단: 기존 공연 "${title}"의 Supabase slug 컬럼이 비어있어 JSON 덮어쓰기를 방지합니다. 마이그레이션 스크립트를 먼저 실행하세요.`);
    }

    // 신규 생성 데이터이고 slug가 없다면 자동 slugify fallback
    if (!id) {
      id = slugify(title, dbId !== undefined && dbId !== null ? String(dbId) : undefined);
    }

    const company = (record.company || '').trim();
    const venue = (record.venue || '').trim();
    const city = ''; // Supabase 에는 city가 없으므로 공백 매핑
    const startDate = (record.start_date || '').trim();
    const endDate = (record.end_date || record.start_date || '').trim();
    const ticketUrl = (record.ticket_url || '').trim();
    const status = 'published';
    const description = (record.description || '').trim();

    // Genre mapping: Use database column if available, else fallback to source mapping
    let genre: string[] = [];
    if (record.genre) {
      genre = record.genre.split(",").map(g => g.trim()).filter(Boolean);
    } else {
      const source = (record.source || '').trim().toLowerCase();
      if (source === 'sejong' || source === 'ntok' || source === 'kncdc') {
        genre = ['무용'];
      }
    }

    // Artist mapping (bigint -> Slug)
    let artistIds: string[] = [];
    const artistUuid = record.artist_id;
    if (artistUuid && artistMap[String(artistUuid)]) {
      artistIds = [artistMap[String(artistUuid)]];
    }

    const imageUrl = (record.image_url || '').trim();
    let posterImage = '';

    if (imageUrl) {
      let ext = '.jpg';
      if (imageUrl.includes('.png')) ext = '.png';
      else if (imageUrl.includes('.jpeg')) ext = '.jpeg';
      else if (imageUrl.includes('.webp')) ext = '.webp';

      const filename = `${id}${ext}`;
      const destPath = path.join(imagesDir, filename);

      const isAirtableUrl = imageUrl.includes("airtableusercontent.com");
      if (fs.existsSync(destPath)) {
        posterImage = `/images/performances/${filename}`;
      } else if (!isAirtableUrl) {
        try {
          const isArko = imageUrl.includes("arko") || imageUrl.includes("arko.or.kr");
          const timeout = isArko ? 30000 : 10000;
          await downloadFile(imageUrl, destPath, timeout);
          posterImage = `/images/performances/${filename}`;
        } catch (downloadErr: any) {
          const errMsg = downloadErr.message || String(downloadErr);
          const is410 = errMsg.includes("HTTP 410");
          const isTimeout = errMsg.includes("timeout");

          if (is410) {
            console.warn(`⚠️ Warning: Expired external poster image for performance "${title}" (HTTP 410)`);
          } else if (isTimeout) {
            console.warn(`⚠️ Warning: Poster image download timeout for performance "${title}" (URL: "${imageUrl}")`);
          } else {
            console.warn(`⚠️ Warning: Failed to download poster for performance "${title}" (URL: "${imageUrl}"): ${errMsg}`);
          }
          
          const existingMatched = existingPerformances.find(
            (ep) => ep.id === id || (ep.recordId !== undefined && String(ep.recordId) === recordId)
          );
          if (existingMatched && existingMatched.posterImage) {
            posterImage = existingMatched.posterImage;
          } else {
            posterImage = imageUrl;
          }
        }
      } else {
        // Airtable URL bypass: suppress warnings and check if we can fall back to existing local image
        const existingMatched = existingPerformances.find(
          (ep) => ep.id === id || (ep.recordId !== undefined && String(ep.recordId) === recordId)
        );
        if (existingMatched && existingMatched.posterImage && !existingMatched.posterImage.includes("airtableusercontent.com")) {
          posterImage = existingMatched.posterImage;
        } else {
          posterImage = '';
        }
      }
    }

    const performance = {
      id,
      title,
      company,
      venue,
      city,
      startDate,
      endDate,
      posterImage,
      imageUrl,
      genre,
      ticketUrl,
      artistIds,
      status,
      description,
      aiSummary: '',
      reviews: [],
      recordId,
      createdAt: record.created_at || new Date().toISOString(),
      updatedAt: record.updated_at || new Date().toISOString(),
      hosts: record.hosts || '',
      organizers: record.organizers || '',
      castMembers: record.cast_members || '',
      director: record.director || '',
      instagramUrl: record.instagram_url || '',
      externalLinks: record.external_links || '',
      submittedBy: record.submitted_by || '',
      source: record.source || 'crawled'
    };

    performances.push(performance);
  }

  // 3. Atomic Write 적용
  const tempPath = path.join(outputDir, 'performances.temp.json');
  fs.writeFileSync(tempPath, JSON.stringify(performances, null, 2), 'utf8');

  // 검증: 비어있지 않고 파싱 가능한지 확인
  try {
    const verifiedData = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
    if (!Array.isArray(verifiedData) || verifiedData.length === 0) {
      throw new Error("임시 JSON 파일 검증 오류: 배열이 비어있거나 올바르지 않습니다.");
    }
    // Rename을 통해 덮어쓰기
    fs.renameSync(tempPath, performancesPath);
  } catch (err: any) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw new Error(`Atomic Write 실패: ${err.message}`);
  }

  // Update sync-meta.json
  const lastSync = new Date().toISOString();
  const metaPath = path.join(outputDir, 'sync-meta.json');
  
  let currentMeta: any = {};
  if (fs.existsSync(metaPath)) {
    try {
      currentMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {}
  }

  const newMeta = {
    ...currentMeta,
    lastSync,
    savedPerformances: performances.length,
    totalRecords: performances.length + (currentMeta.savedArtists || 0)
  };
  fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2), 'utf8');

  return {
    success: true,
    totalRecords: dbRecords.length,
    savedPerformances: performances.length,
    lastSync
  };
}
