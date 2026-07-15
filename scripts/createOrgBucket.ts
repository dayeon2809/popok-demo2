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

    const hasBucket = buckets.some(b => b.name === "org-applications");
    if (hasBucket) {
      console.log("Bucket 'org-applications' already exists.");
    } else {
      console.log("Creating private bucket 'org-applications'...");
      // Private: applications carry contact info + resumes, so this bucket is
      // never public. Files are only reachable via short-lived signed URLs
      // issued to authenticated admins (see /api/admin/organizations/[id]/resume).
      const { data, error } = await supabase.storage.createBucket("org-applications", {
        public: false,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: 20 * 1024 * 1024 // 20MB — matches client + API validation
      });
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
