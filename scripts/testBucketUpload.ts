import fs from "fs";
import path from "path";
import { getSupabaseServer } from "../lib/supabaseServer";

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
  
  const supabase = getSupabaseServer();
  // 1x1 transparent PNG data bytes
  const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const testBuffer = Buffer.from(base64Png, "base64");
  const filePath = `test/test-${Date.now()}.png`;
  
  console.log(`Attempting to upload mock PNG image to bucket 'artist-media' at path: ${filePath}`);
  
  try {
    const { data, error } = await supabase.storage
      .from("artist-media")
      .upload(filePath, testBuffer, {
        contentType: "image/png",
        upsert: true
      });
      
    if (error) {
      console.error("❌ Upload failed:", error);
      return;
    }
    
    console.log("✅ Upload successful. Data:", data);
    
    const { data: urlData } = supabase.storage
      .from("artist-media")
      .getPublicUrl(filePath);
      
    console.log("🔗 Public URL resolved:", urlData.publicUrl);
    
    console.log("Testing fetch on public URL...");
    const res = await fetch(urlData.publicUrl);
    if (res.ok) {
      console.log(`🎉 Public access verified! Content length: ${res.headers.get("content-length")} bytes, type: ${res.headers.get("content-type")}`);
    } else {
      console.error(`❌ Public access failed: HTTP ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error("❌ Exception during test upload:", err);
  }
}

run();
