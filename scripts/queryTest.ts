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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const { data: nonNullArtistIdPerfs, error } = await supabase
      .from("performances")
      .select("id, title, artist_id")
      .not("artist_id", "is", null)
      .limit(5);

    console.log("Performances with non-null artist_id:", nonNullArtistIdPerfs);
    if (error) console.error(error);
  } catch (err) {
    console.error("Error executing query:", err);
  }
}

run();
