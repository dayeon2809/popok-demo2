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
    // We can run queries against pg_catalog using PostgreSQL REST RPC if we have the permissions.
    // However, if we don't have SQL execution endpoints, we can fetch from the OpenAPI/PostgREST schema or metadata.
    // Let's try querying standard system tables using standard PostgREST RPC if it exposes any database views.
    // If not, we can inspect using supabase RPC if there's any.
    // Let's check what constraints are on performances. Since PostgREST exposes schemas, let's query the table itself
    // to check if there are any non-null artist_id values in the entire performances table:
    const { count, error: countError } = await supabase
      .from("performances")
      .select("artist_id", { count: "exact", head: true })
      .not("artist_id", "is", null);

    console.log("Count of performances with non-null artist_id:", count);
    if (countError) console.error("Count Error:", countError);

    // Let's query to inspect if there's any foreign key. We can try querying information_schema.table_constraints
    // via a standard supabase select on standard views if they are exposed, or check permissions.
    // Let's check columns for performances and artists.
    const { data: cols, error: colError } = await supabase
      .from("performances")
      .select("*")
      .limit(1);
    
    console.log("Sample performance columns:", cols ? Object.keys(cols[0]) : null);
  } catch (err) {
    console.error("Error inspecting database:", err);
  }
}

run();
