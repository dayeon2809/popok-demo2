import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../lib/supabaseServer";
import {
  createSubmission,
  getSubmissions,
  updateSubmission,
  updateSubmissionStatus,
  createArtistFromSubmission,
} from "../lib/supabaseSubmissions";

// Load environment variables from .env.local manually for command line run
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

async function runTests() {
  loadEnv();
  console.log("=========================================");
  console.log("🚀 Supabase Submissions Migration E2E Test");
  console.log("=========================================\n");

  const supabase = getSupabaseServer() as any;
  let testSubmissionId: number | null = null;
  let testArtistId: number | null = null;

  try {
    // 1. Submit a new registration request
    console.log("👉 Step 1: Submitting a new test registration request...");
    const payload = {
      name: "홍길동테스트",
      email: "test-hong@example.com",
      instagram: "https://instagram.com/test-hong",
      website: "https://test-hong.com",
      bio: "안녕하세요. 무용수 홍길동입니다. 반갑습니다.",
      works: "작품A (2024), 작품B (2025)",
      portfolio_url: "https://test-hong.com/portfolio-hong.pdf",
      name_en: "Hong Gil Dong",
      city_or_region: "Seoul",
      bio_short: "Short bio test",
      portfolio_works: [
        {
          title: "작품A",
          year: "2024",
          description: "작품설명A",
          role: "안무",
          image_url: "https://test-hong.com/a.jpg",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      ]
    };

    const submitResult = await createSubmission(payload);
    testSubmissionId = Number(submitResult.id);
    console.log(`✅ Success: Submission created with ID: ${testSubmissionId}\n`);

    // 2. Verify Supabase submissions table values directly
    console.log("👉 Step 2: Verifying database values directly from Supabase...");
    const { data: dbSub, error: dbSubErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", testSubmissionId)
      .single();

    if (dbSubErr || !dbSub) {
      throw new Error(`Failed to query submission directly: ${dbSubErr?.message}`);
    }

    console.log("Fetched submissions columns directly:");
    console.log(`- name: ${dbSub.name}`);
    console.log(`- email: ${dbSub.email}`);
    console.log(`- portfolio_url: ${dbSub.portfolio_url}`);
    console.log(`- bio: ${dbSub.bio}`);
    console.log(`- works: ${dbSub.works}`);
    console.log(`- status: ${dbSub.status}`);
    console.log(`- created_at: ${dbSub.created_at}`);

    if (dbSub.email !== payload.email) throw new Error("Email column mismatch!");
    if (dbSub.portfolio_url !== payload.portfolio_url) throw new Error("Portfolio URL column mismatch!");
    if (dbSub.bio !== payload.bio) throw new Error("Bio column mismatch!");
    console.log("✅ Success: Columns saved and mapped correctly!\n");

    // 3. Verify getSubmissions lists (Admin View check)
    console.log("👉 Step 3: Checking admin submission list retrieval...");
    const submissionsList = await getSubmissions();
    const foundSub = submissionsList.find(s => s.id === String(testSubmissionId));

    if (!foundSub) {
      throw new Error("Created submission was not found in getSubmissions list!");
    }

    console.log("Retrieved submission properties in admin list:");
    console.log(`- name: ${foundSub.name}`);
    console.log(`- email: ${foundSub.email}`);
    console.log(`- portfolio_url: ${foundSub.portfolio_url}`);
    console.log(`- bio: ${foundSub.bio}`);
    console.log(`- status: ${foundSub.status}`);
    console.log("✅ Success: List retrieval works properly!\n");

    // 4. Verify editing the submission (Update check)
    console.log("👉 Step 4: Editing the test submission...");
    const updatedWorks = "수정작품A (2025), 수정작품B (2026)";
    const updatedBio = "소개글이 수정되었습니다.";
    await updateSubmission(String(testSubmissionId), {
      works: updatedWorks,
      bio: updatedBio,
    });

    const { data: dbSubUpdated, error: dbSubUpErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", testSubmissionId)
      .single();

    if (dbSubUpErr || !dbSubUpdated) {
      throw new Error(`Failed to query updated submission: ${dbSubUpErr?.message}`);
    }

    console.log("Updated submission values:");
    console.log(`- works: ${dbSubUpdated.works}`);
    console.log(`- bio: ${dbSubUpdated.bio}`);

    if (dbSubUpdated.works !== updatedWorks) throw new Error("Works column not updated!");
    if (dbSubUpdated.bio !== updatedBio) throw new Error("Bio column not updated!");
    console.log("✅ Success: Submission edited successfully!\n");

    // 5. Approve the submission (Create artist verification)
    console.log("👉 Step 5: Approving submission and generating artist...");
    // 5.1 Create artist record
    const parsedWorks = dbSubUpdated.works.split(",").map((w: string) => w.trim()).filter(Boolean);
    const artistResult = await createArtistFromSubmission({
      name: dbSubUpdated.name,
      company: "홍길동 컴퍼니",
      works: parsedWorks,
      field: "contemporary_dance",
      genre: "contemporary",
      instagram: dbSubUpdated.instagram,
      website: dbSubUpdated.website,
      email: dbSubUpdated.email,
      name_en: dbSubUpdated.name_en,
      city_or_region: dbSubUpdated.city_or_region,
      bio_short: dbSubUpdated.bio_short,
      portfolio_works: dbSubUpdated.portfolio_works,
    });

    testArtistId = Number(artistResult.id);
    console.log(`Artist created in Supabase with ID: ${testArtistId}`);

    // 5.2 Verify artist properties
    const { data: dbArtist, error: dbArtistErr } = await supabase
      .from("artists")
      .select("*")
      .eq("id", testArtistId)
      .single();

    if (dbArtistErr || !dbArtist) {
      throw new Error(`Failed to query created artist: ${dbArtistErr?.message}`);
    }

    console.log("Fetched artist columns directly:");
    console.log(`- name: ${dbArtist.name}`);
    console.log(`- company: ${dbArtist.company}`);
    console.log(`- role: ${dbArtist.role}`);
    console.log(`- genre: ${dbArtist.genre}`);
    console.log(`- slug: ${dbArtist.slug}`);
    console.log(`- email: ${dbArtist.email}`);
    console.log(`- attachment: ${dbArtist.attachment}`);
    console.log(`- name_en: ${dbArtist.name_en}`);
    console.log(`- city_or_region: ${dbArtist.city_or_region}`);
    console.log(`- bio_short: ${dbArtist.bio_short}`);
    console.log(`- portfolio_works: ${JSON.stringify(dbArtist.portfolio_works, null, 2)}`);

    if (dbArtist.name !== "홍길동테스트") throw new Error("Artist name mismatch!");
    if (dbArtist.company !== "홍길동 컴퍼니") throw new Error("Artist company mismatch!");
    if (dbArtist.role !== "<수정작품A (2025)>, <수정작품B (2026)>") throw new Error("Artist role format mismatch!");
    if (dbArtist.genre !== "contemporary_dance,contemporary") throw new Error("Artist genre string mismatch!");
    if (dbArtist.email !== "test-hong@example.com") throw new Error("Artist email mismatch!");
    if (!dbArtist.slug.startsWith("홍길동테스트-") || dbArtist.slug.length !== "홍길동테스트".length + 9) {
      throw new Error(`Artist slug format mismatch: ${dbArtist.slug}`);
    }

    console.log("✅ Success: Artist row and slug generated correctly!\n");

    // 6. Set submission status to approved
    console.log("👉 Step 6: Setting submission status to approved...");
    await updateSubmissionStatus(String(testSubmissionId), "approved");

    const { data: dbSubFinal, error: dbSubFinalErr } = await supabase
      .from("submissions")
      .select("status")
      .eq("id", testSubmissionId)
      .single();

    if (dbSubFinalErr || !dbSubFinal) {
      throw new Error(`Failed to verify submission final status: ${dbSubFinalErr?.message}`);
    }

    console.log(`Submission final status: ${dbSubFinal.status}`);
    if (dbSubFinal.status !== "approved") throw new Error("Submission status was not updated to approved!");
    console.log("✅ Success: Submission status successfully approved!\n");

    console.log("🎉 All E2E tests passed successfully!");

  } catch (testErr) {
    console.error("❌ Test failed:", testErr);
  } finally {
    // 7. Cleanup
    console.log("\n🧹 Cleaning up test database records...");
    if (testSubmissionId) {
      const { error: delSubErr } = await supabase
        .from("submissions")
        .delete()
        .eq("id", testSubmissionId);
      if (delSubErr) console.warn("Failed to delete test submission:", delSubErr);
      else console.log(`Deleted test submission ID: ${testSubmissionId}`);
    }
    if (testArtistId) {
      const { error: delArtistErr } = await supabase
        .from("artists")
        .delete()
        .eq("id", testArtistId);
      if (delArtistErr) console.warn("Failed to delete test artist:", delArtistErr);
      else console.log(`Deleted test artist ID: ${testArtistId}`);
    }
    console.log("Cleanup completed.\n");
  }
}

runTests();
