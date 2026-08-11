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
      // PDF/DOCX/TXT — matches lib/resumeFileTypes.ts's detectResumeFileExtension.
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      fileSizeLimit: 20 * 1024 * 1024 // 20MB — matches client + API validation
    };

    const hasBucket = buckets.some(b => b.name === "org-applications");
    if (hasBucket) {
      // Re-running this script (e.g. after DOCX/TXT support was added)
      // should bring an already-created bucket's allowed MIME types up to
      // date rather than silently leaving it PDF-only.
      console.log("Bucket 'org-applications' already exists — syncing config...");
      const { error } = await supabase.storage.updateBucket("org-applications", bucketConfig);
      if (error) {
        throw error;
      }
      console.log("Bucket 'org-applications' config updated.");
    } else {
      console.log("Creating private bucket 'org-applications'...");
      // Private: applications carry contact info + resumes, so this bucket is
      // never public. Files are only reachable via short-lived signed URLs
      // issued to authenticated admins (see /api/admin/organizations/[id]/resume).
      const { data, error } = await supabase.storage.createBucket("org-applications", bucketConfig);
      if (error) {
        throw error;
      }
      console.log("Bucket 'org-applications' created successfully:", data);
    }
  } catch (err) {
    console.error("Failed to setup bucket:", err);
  }
}

run();
