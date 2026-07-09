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

export interface SyncResult {
  success: boolean;
  totalRecords: number;
  savedArtists: number;
  lastSync: string;
}

export interface DbArtistRow {
  id: string | number;
  name: string;
  slug?: string | null;
  company?: string | null;
  ai_summary?: string | null;
  role?: string | null;
  genre?: string | null;
  attachment?: string | null;
  profile_image?: string | null;
  review_links?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name_en?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  portfolio_works?: any | null;
}

export async function syncArtistsFromAirtable(): Promise<SyncResult> {
  if (process.env.VERCEL === "1") {
    throw new Error("Vercel production environment is read-only. Database to file synchronization is not allowed.");
  }

  // Fetch all records from Supabase
  const { data: dbRecords, error } = await (getSupabaseServer().from("artists") as unknown as {
    select: (columns: string) => Promise<{ data: DbArtistRow[] | null; error: any }>
  })
    .select("*");

  if (error) {
    throw new Error(`Supabase artists 테이블 조회 실패: ${error.message}`);
  }

  const outputDir = path.join(process.cwd(), 'data');
  const imagesDir = path.join(process.cwd(), 'public/images/artists');

  // Ensure directories exist
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  // 1. JSON 보호 가드: Supabase 데이터가 아예 비어있으면 덮어쓰지 않고 중단
  if (!dbRecords || dbRecords.length === 0) {
    throw new Error("❌ 동기화 중단: Supabase artists 테이블이 비어있습니다. 기존 JSON 캐시를 보호합니다.");
  }

  // 기존 JSON 로드
  const artistsPath = path.join(outputDir, 'artists.json');
  let existingArtists: any[] = [];
  if (fs.existsSync(artistsPath)) {
    try {
      existingArtists = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));
    } catch (e) {
      console.warn("기존 artists.json 읽기 실패, 신규 비교 패스:", e);
    }
  }

  const artists: any[] = [];

  for (const record of dbRecords) {
    const name = (record.name || "").trim();
    if (!name) continue;

    const recordId = String(record.id); // UUID or Integer ID as string

    // 2. JSON 보호 가드: 기존에 존재하는 항목인지 비교하고, 기존 항목인데 Supabase slug가 없으면 중단
    const matchedExisting = existingArtists.find(ea => ea.recordId !== undefined && String(ea.recordId) === recordId);
    let id = record.slug ? record.slug.trim() : "";

    if (matchedExisting && !id) {
      throw new Error(`❌ 동기화 중단: 기존 아티스트 "${name}"의 Supabase slug 컬럼이 비어있어 JSON 덮어쓰기를 방지합니다. 마이그레이션 스크립트를 먼저 실행하세요.`);
    }

    // 신규 생성 데이터이고 slug가 없다면 자동 slugify fallback
    if (!id) {
      id = slugify(name, recordId);
    }

    const company = record.company || '';
    const bio = record.ai_summary || '';
    const worksList = parseStringToArray(record.role || '');

    let field = 'unknown';
    let genre = 'unknown';
    const genreVal = record.genre;
    if (typeof genreVal === 'string') {
      const parts = genreVal.split(',').map(s => s.trim());
      field = parts[0] || 'unknown';
      genre = parts[1] || 'unknown';
    }

    if (genre === 'korean dance' || genre === 'korean_dance') genre = 'korean';
    if (genre === 'contemporary dance' || genre === 'contemporary_dance') genre = 'contemporary';
    if (field === 'dance' && genre === 'unknown') {
      const lowerName = (name + ' ' + company).toLowerCase();
      if (lowerName.includes('발레') || lowerName.includes('ballet')) genre = 'ballet';
      else if (lowerName.includes('한국무용') || lowerName.includes('traditional')) genre = 'korean';
      else genre = 'contemporary';
    }

    let instagram = '';
    let website = '';
    const attachment = record.attachment || '';
    if (attachment && typeof attachment === 'string') {
      if (attachment.includes('instagram.com')) {
        instagram = attachment;
      } else {
        website = attachment;
      }
    }

    let profileImage = '';
    const profileImageUrl = record.profile_image || '';
    if (profileImageUrl) {
      let ext = '.jpg';
      if (profileImageUrl.includes('.png')) ext = '.png';
      else if (profileImageUrl.includes('.jpeg')) ext = '.jpeg';
      else if (profileImageUrl.includes('.webp')) ext = '.webp';

      const filename = `${id}${ext}`;
      const destPath = path.join(imagesDir, filename);

      const isAirtableUrl = profileImageUrl.includes("airtableusercontent.com");
      if (fs.existsSync(destPath)) {
        profileImage = `/images/artists/${filename}`;
      } else if (!isAirtableUrl) {
        try {
          const isArko = profileImageUrl.includes("arko") || profileImageUrl.includes("arko.or.kr");
          const timeout = isArko ? 30000 : 10000;
          await downloadFile(profileImageUrl, destPath, timeout);
          profileImage = `/images/artists/${filename}`;
        } catch (downloadErr: any) {
          const errMsg = downloadErr.message || String(downloadErr);
          const is410 = errMsg.includes("HTTP 410");
          const isTimeout = errMsg.includes("timeout");

          if (is410) {
            console.warn(`⚠️ Warning: Expired external image for artist "${name}" (HTTP 410)`);
          } else if (isTimeout) {
            console.warn(`⚠️ Warning: Image download timeout for artist "${name}" (URL: "${profileImageUrl}")`);
          } else {
            console.warn(`⚠️ Warning: Failed to download image for artist "${name}" (URL: "${profileImageUrl}"): ${errMsg}`);
          }
          
          const existingMatched = existingArtists.find(
            (ea) => ea.id === id || (ea.recordId !== undefined && String(ea.recordId) === recordId)
          );
          if (existingMatched && existingMatched.profileImage) {
            profileImage = existingMatched.profileImage;
          } else {
            profileImage = profileImageUrl;
          }
        }
      } else {
        // Airtable URL bypass: suppress warnings and check if we can fall back to existing local image
        const existingMatched = existingArtists.find(
          (ea) => ea.id === id || (ea.recordId !== undefined && String(ea.recordId) === recordId)
        );
        if (existingMatched && existingMatched.profileImage && !existingMatched.profileImage.includes("airtableusercontent.com")) {
          profileImage = existingMatched.profileImage;
        } else {
          profileImage = '';
        }
      }
    }

    const aiSummary = record.ai_summary || '';
    const reviewLinksRaw = record.review_links || '';
    const reviews: any[] = [];
    if (reviewLinksRaw && typeof reviewLinksRaw === 'string') {
      const lines = reviewLinksRaw.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const parts = trimmedLine.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          reviews.push({
            workTitle: parts[0],
            source: parts[1],
            url: parts[2]
          });
        }
      }
    }

    const artist: any = {
      id,
      name,
      company: typeof company === 'string' ? company.trim() : String(company),
      bio: typeof bio === 'string' ? bio.trim() : String(bio),
      works: worksList,
      field,
      genre,
      instagram,
      website,
      profileImage,
      residency: [],
      festival: [],
      status: 'published',
      verified: true,
      aiSummary: typeof aiSummary === 'string' ? aiSummary.trim() : String(aiSummary),
      reviews,
      recordId,
      createdAt: record.created_at || new Date().toISOString(),
      updatedAt: record.updated_at || new Date().toISOString(),
      name_en: record.name_en || '',
      city_or_region: record.city_or_region || '',
      bio_short: record.bio_short || '',
      portfolio_works: record.portfolio_works || []
    };

    let type = 'individual';
    const textToTest = `${name} ${company}`.toLowerCase();
    if (
      textToTest.includes('무용단') ||
      textToTest.includes('발레단') ||
      textToTest.includes('예술단') ||
      textToTest.includes('무용회') ||
      textToTest.includes('company') ||
      textToTest.includes('컴퍼니') ||
      textToTest.includes('아트컴퍼니')
    ) {
      type = 'company';
    } else if (
      textToTest.includes('프로젝트') ||
      textToTest.includes('project') ||
      textToTest.includes('컬렉티브') ||
      textToTest.includes('collective')
    ) {
      type = 'project_group';
    }
    artist.type = type;

    const tags = [];
    const typeMap: Record<string, string> = { individual: '안무가', company: '무용단', project_group: '프로젝트팀' };
    tags.push(typeMap[type]);
    if (field === 'dance') {
      if (genre === 'contemporary') tags.push('현대무용');
      else if (genre === 'korean') tags.push('한국무용');
      else if (genre === 'ballet') tags.push('발레');
    } else if (field === 'interdisciplinary') {
      tags.push('다원예술');
    }
    if (instagram) tags.push('SNS');
    if (website) tags.push('웹사이트');
    if (worksList.length >= 5) tags.push('다수작품');
    tags.push('검증됨');
    artist.tags = tags;

    artists.push(artist);
  }

  // 3. Atomic Write 적용
  const tempPath = path.join(outputDir, 'artists.temp.json');
  fs.writeFileSync(tempPath, JSON.stringify(artists, null, 2), 'utf8');

  // 검증: 비어있지 않고 파싱 가능한지 확인
  try {
    const verifiedData = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
    if (!Array.isArray(verifiedData) || verifiedData.length === 0) {
      throw new Error("임시 JSON 파일 검증 오류: 배열이 비어있거나 올바르지 않습니다.");
    }
    // Rename을 통해 덮어쓰기
    fs.renameSync(tempPath, artistsPath);
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
    savedArtists: artists.length,
    totalRecords: dbRecords.length + (currentMeta.savedPerformances || 0)
  };
  fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2), 'utf8');

  return {
    success: true,
    totalRecords: dbRecords.length,
    savedArtists: artists.length,
    lastSync
  };
}
