import fs from "fs";
import path from "path";
import { syncArtistsFromAirtable } from "../lib/syncArtists";

// Load environment variables from .env.local manually for command line run
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
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
  console.log("Starting Supabase CLI Sync...");
  
  let artistRes = null;
  let artistErrObj: any = null;
  try {
    artistRes = await syncArtistsFromAirtable();
  } catch (artistErr: any) {
    artistErrObj = artistErr;
    console.warn("⚠️ Artists sync skipped or encountered warnings:", artistErr.message || artistErr);
  }
  
  console.log("\n=========================================");
  console.log("📊 CLI SYNC COMPLETE SUMMARY");
  console.log("=========================================");
  
  if (artistRes) {
    console.log(`✅ Artists: Sync Succeeded. Total in DB: ${artistRes.totalRecords}, Cached to JSON: ${artistRes.savedArtists}`);
  } else {
    console.log(`⚠️ Artists: Sync Failed / Skipped (${artistErrObj?.message || artistErrObj})`);
  }
  
  console.log("=========================================\n");
  
  // Exit successfully even if warning occurred, preventing workflow crashes
  process.exit(0);
}

run();
