import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Helper to manually load env vars from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
}

function cleanString(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\.jpg/gi, "")
    .replace(/\.png/gi, "")
    .replace(/[\s\(\)<>\[\]\{\}『』\-\_&|]/g, "")
    .toLowerCase();
}

async function run() {
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ 에러: Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
    console.error("필요 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const writeMode = process.argv.includes("--write");
  console.log(`========================================`);
  console.log(`🚀 Supabase Slug Migration Script`);
  console.log(`모드: ${writeMode ? "✍️ REAL WRITE (실제 DB 반영)" : "🔍 DRY RUN (시뮬레이션)"}`);
  console.log(`========================================\n`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const artistsPath = path.join(process.cwd(), "data/artists.json");
  const performancesPath = path.join(process.cwd(), "data/performances.json");

  if (!fs.existsSync(artistsPath) || !fs.existsSync(performancesPath)) {
    console.error("❌ 에러: data/artists.json 또는 data/performances.json 파일이 없습니다.");
    process.exit(1);
  }

  const localArtists = JSON.parse(fs.readFileSync(artistsPath, "utf8"));
  const localPerformances = JSON.parse(fs.readFileSync(performancesPath, "utf8"));

  // 1. Migrate Artists
  console.log(`\n----------------------------------------`);
  console.log(`👤 1. Artists Slug Migration`);
  console.log(`----------------------------------------`);

  const artistReport = {
    matched: [] as { slug: string; name: string; dbId: string }[],
    ambiguous: [] as { slug: string; name: string; reasons: string }[],
    unmatched: [] as { slug: string; name: string }[]
  };

  for (const artist of localArtists) {
    const slug = artist.id; // 기존 JSON의 id가 slug 역할
    const name = artist.name;
    const company = artist.company || "";

    try {
      // name으로 Supabase 조회
      const { data: matches, error } = await supabase
        .from("artists")
        .select("id, name, company")
        .eq("name", name);

      if (error) {
        throw error;
      }

      if (!matches || matches.length === 0) {
        artistReport.unmatched.push({ slug, name });
      } else if (matches.length === 1) {
        artistReport.matched.push({ slug, name, dbId: matches[0].id });
        if (writeMode) {
          const { error: updateErr } = await supabase
            .from("artists")
            .update({ slug })
            .eq("id", matches[0].id);
          if (updateErr) throw updateErr;
        }
      } else {
        // 동명이인 2명 이상 발견 -> company로 추가 매칭 시도
        const companyMatches = matches.filter(m => {
          const mComp = cleanString(m.company || "");
          const lComp = cleanString(company);
          return mComp === lComp || mComp.includes(lComp) || lComp.includes(mComp);
        });

        if (companyMatches.length === 1) {
          artistReport.matched.push({ slug, name, dbId: companyMatches[0].id });
          if (writeMode) {
            const { error: updateErr } = await supabase
              .from("artists")
              .update({ slug })
              .eq("id", companyMatches[0].id);
            if (updateErr) throw updateErr;
          }
        } else {
          artistReport.ambiguous.push({
            slug,
            name,
            reasons: `동명이인 (${matches.length}명), 단체명 매칭 실패 (JSON 단체: "${company}")`
          });
        }
      }
    } catch (err: any) {
      console.error(`❌ Artist "${name}" 처리 중 에러:`, err.message || err);
    }
  }

  // 2. Migrate Performances
  console.log(`\n----------------------------------------`);
  console.log(`🎭 2. Performances Slug Migration`);
  console.log(`----------------------------------------`);

  const performanceReport = {
    matched: [] as { slug: string; title: string; dbId: string }[],
    ambiguous: [] as { slug: string; title: string; reasons: string }[],
    unmatched: [] as { slug: string; title: string }[]
  };

  for (const perf of localPerformances) {
    const slug = perf.id; // 기존 JSON의 id가 slug 역할
    const title = perf.title;
    const venue = perf.venue || "";
    const startDate = perf.startDate || "";

    try {
      // 1순위: recordId로 external_id 매칭 시도
      let matches: any[] = [];
      const recordId = perf.recordId || "";
      if (recordId) {
        const { data: recordIdMatches, error } = await supabase
          .from("performances")
          .select("id, title, venue, start_date")
          .eq("external_id", recordId);

        if (!error && recordIdMatches && recordIdMatches.length > 0) {
          matches = recordIdMatches;
        }
      }

      // 2순위: title + venue + startDate 복합 조건 매칭 (정확히 일치하는 경우)
      if (matches.length === 0) {
        const { data: compMatches, error } = await supabase
          .from("performances")
          .select("id, title, venue, start_date")
          .eq("title", title)
          .eq("venue", venue)
          .eq("start_date", startDate);

        if (!error && compMatches && compMatches.length > 0) {
          matches = compMatches;
        }
      }

      // 3순위: venue + startDate 일치하면서 title을 cleanString으로 비교하여 매칭하는 fallback
      if (matches.length === 0) {
        const { data: dateVenueMatches, error } = await supabase
          .from("performances")
          .select("id, title, venue, start_date")
          .eq("venue", venue)
          .eq("start_date", startDate);

        if (!error && dateVenueMatches && dateVenueMatches.length > 0) {
          const cleanTitleJson = cleanString(title);
          const filtered = dateVenueMatches.filter(m => cleanString(m.title) === cleanTitleJson);
          if (filtered.length > 0) {
            matches = filtered;
          }
        }
      }

      if (matches.length === 0) {
        performanceReport.unmatched.push({ slug, title });
      } else if (matches.length === 1) {
        performanceReport.matched.push({ slug, title, dbId: matches[0].id });
        if (writeMode) {
          const { error: updateErr } = await supabase
            .from("performances")
            .update({ slug })
            .eq("id", matches[0].id);
          if (updateErr) throw updateErr;
        }
      } else {
        performanceReport.ambiguous.push({
          slug,
          title,
          reasons: `복합 매칭 중복 (${matches.length}개 발견)`
        });
      }
    } catch (err: any) {
      console.error(`❌ Performance "${title}" 처리 중 에러:`, err.message || err);
    }
  }

  // 3. Print Results Summary
  console.log(`\n========================================`);
  console.log(`📊 MIGRATION SUMMARY (결과 요약)`);
  console.log(`========================================`);

  console.log(`\n[👤 ARTISTS]`);
  console.log(`✅ Matched:   ${artistReport.matched.length} 명`);
  console.log(`⚠️ Ambiguous: ${artistReport.ambiguous.length} 명`);
  console.log(`❌ Unmatched: ${artistReport.unmatched.length} 명`);

  if (artistReport.ambiguous.length > 0) {
    console.log(`\n--- ⚠️ Ambiguous Artists Details ---`);
    artistReport.ambiguous.forEach(a => {
      console.log(`- ${a.name} (${a.slug}): ${a.reasons}`);
    });
  }

  if (artistReport.unmatched.length > 0) {
    console.log(`\n--- ❌ Unmatched Artists Details ---`);
    artistReport.unmatched.forEach(a => {
      console.log(`- ${a.name} (${a.slug})`);
    });
  }

  console.log(`\n[🎭 PERFORMANCES]`);
  console.log(`✅ Matched:   ${performanceReport.matched.length} 개`);
  console.log(`⚠️ Ambiguous: ${performanceReport.ambiguous.length} 개`);
  console.log(`❌ Unmatched: ${performanceReport.unmatched.length} 개`);

  if (performanceReport.ambiguous.length > 0) {
    console.log(`\n--- ⚠️ Ambiguous Performances Details ---`);
    performanceReport.ambiguous.forEach(p => {
      console.log(`- ${p.title} (${p.slug}): ${p.reasons}`);
    });
  }

  if (performanceReport.unmatched.length > 0) {
    console.log(`\n--- ❌ Unmatched Performances Details ---`);
    performanceReport.unmatched.forEach(p => {
      console.log(`- ${p.title} (${p.slug})`);
    });
  }

  console.log(`\n========================================`);
  if (!writeMode) {
    console.log(`👉 실제 DB에 반영하려면 뒤에 --write를 붙여 실행하세요.`);
    console.log(`예: npx tsx scripts/migrateSlugsToSupabase.ts --write`);
  } else {
    console.log(`✅ 실제 DB 반영 작업이 완료되었습니다.`);
  }
  console.log(`========================================`);
}

run();
