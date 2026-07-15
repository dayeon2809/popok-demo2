import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

async function run() {
  loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw listError;
    }

    const bucketConfig = {
      public: false,
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      fileSizeLimit: 20 * 1024 * 1024 // 20MB — matches client + API validation
    };

    const hasBucket = buckets.some(b => b.name === "company-source-files");
    if (hasBucket) {
      // Re-running this script (e.g. after the file-size limit changed from
      // 10MB to 20MB) should bring an already-created bucket's config up to
      // date rather than silently leaving it stale.
      console.log("Bucket 'company-source-files' already exists — syncing config...");
      const { error } = await supabase.storage.updateBucket("company-source-files", bucketConfig);
      if (error) {
        throw error;
      }
      console.log("Bucket 'company-source-files' config updated.");
    } else {
      console.log("Creating private bucket 'company-source-files'...");
      // Private: admin-only "AI 분석용 자료" resumes, reachable only via
      // short-lived signed URLs issued to authenticated admins (see
      // /api/admin/companies/[id]/source-file). Kept entirely separate from
      // the "org-applications" bucket that holds applicants' original
      // uploads — admin replacements never touch that bucket.
      const { data, error } = await supabase.storage.createBucket("company-source-files", bucketConfig);
      if (error) {
        throw error;
      }
      console.log("Bucket 'company-source-files' created successfully:", data);
    }
  } catch (err) {
    console.error("Failed to setup bucket:", err);
  }
}

run();
