import fs from "fs";
import path from "path";

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

  const headers: Record<string, string> = {
    "apikey": supabaseServiceKey,
    "Authorization": `Bearer ${supabaseServiceKey}`
  };
  try {
    const url = supabaseUrl.endsWith("/rest/v1") ? supabaseUrl : `${supabaseUrl}/rest/v1/`;
    const res = await fetch(url, { headers });
    const schema: any = await res.json();
    if (schema && schema.definitions) {
      console.log("Available tables:", Object.keys(schema.definitions));
      console.log("\n--- artists ---");
      console.log(JSON.stringify(schema.definitions.artists, null, 2));
      console.log("\n--- performances ---");
      console.log(JSON.stringify(schema.definitions.performances, null, 2));
    } else {
      console.log("Could not fetch definitions.");
    }
  } catch (err) {
    console.error("Failed to fetch OpenAPI definition:", err);
  }
}

run();
