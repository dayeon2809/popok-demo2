const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Loads .env.local into process.env for standalone `node` execution (Next.js
// only does this automatically inside its own dev/build/start runtime).
// Never overrides a variable already set in the real environment (CI, shell).
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) return;
    const key = match[1];
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  });
}
loadEnvLocal();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Set them in .env.local or your shell environment before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const companyId = 'f95f2029-db1d-4e84-85f9-dd8a8ff55fe6'; // 공원 (GONGWON)
const dancers = [
  { name: '노예슬', slug: 'noh-ye-seul' },
  { name: '민경원', slug: 'min-kyung-won' },
  { name: '이경엽', slug: 'lee-kyung-yeop' },
  { name: '양성윤', slug: 'yang-sung-yoon' },
  { name: '조선재', slug: 'jo-sun-jae' }
];

async function run() {
  try {
    console.log("1. Adding 5 dancers to artists table...");
    
    for (const d of dancers) {
      // Check if artist already exists
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id')
        .eq('name', d.name)
        .maybeSingle();

      let artistId;
      if (existingArtist) {
        console.log(`Artist '${d.name}' already exists (ID: ${existingArtist.id}).`);
        artistId = existingArtist.id;
      } else {
        const { data: newArtist, error: insertError } = await supabase
          .from('artists')
          .insert({
            name: d.name,
            slug: d.slug,
            status: 'published',
            verified: true,
            role: '무용수',
            genre: 'contemporary',
            category: 'dance',
            artist_type: 'individual',
            company: '공원',
            bio_short: `공원(GONGWON) 소속 무용수 ${d.name}입니다.`,
            is_demo: false,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`Failed to insert artist '${d.name}':`, insertError);
          continue;
        }
        artistId = newArtist.id;
        console.log(`Successfully inserted artist '${d.name}' (ID: ${artistId}).`);
      }

      // Check if link in artist_companies already exists
      const { data: existingRelation } = await supabase
        .from('artist_companies')
        .select('id')
        .eq('artist_id', artistId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existingRelation) {
        console.log(`Relation between '${d.name}' and '공원' already exists.`);
      } else {
        const { error: relError } = await supabase
          .from('artist_companies')
          .insert({
            artist_id: artistId,
            company_id: companyId,
            role: '무용수',
            is_current: true,
            is_primary: true
          });

        if (relError) {
          console.error(`Failed to link '${d.name}' to '공원':`, relError);
        } else {
          console.log(`Successfully linked '${d.name}' to '공원'.`);
        }
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration crashed:", err);
  }
}

run();
