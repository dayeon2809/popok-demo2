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

async function run() {
  try {
    console.log("1. Removing '테스트 무용단체' from companies...");
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('name', '테스트 무용단체');

    if (deleteError) {
      console.error("Failed to delete test company:", deleteError);
      return;
    }
    console.log("Successfully removed '테스트 무용단체'.");

    console.log("2. Loading companies-from-artists.json...");
    const rawData = fs.readFileSync('companies-from-artists.json', 'utf8');
    const companies = JSON.parse(rawData);

    const targets = ['엠비규어스댄스컴퍼니', '안은미컴퍼니', '고스트그룹', '해니쉬발레', '99댄스컴퍼니'];
    const selectedCompanies = companies.filter(c => targets.includes(c.name));

    console.log(`Found ${selectedCompanies.length} selected companies in JSON.`);

    for (const c of selectedCompanies) {
      console.log(`Processing company: ${c.name}`);

      const brandColors = {
        '엠비규어스댄스컴퍼니': '#C8EE52',
        '안은미컴퍼니': '#FF5E97',
        '고스트그룹': '#4A5568',
        '해니쉬발레': '#E6C3C3',
        '99댄스컴퍼니': '#4A8C6F'
      };

      let companyWorks = c.works || [];
      if (c.name === '엠비규어스댄스컴퍼니' && companyWorks.length > 0) {
        companyWorks = companyWorks.map((work, idx) => {
          if (idx === 0) {
            return {
              ...work,
              venue: '아르코예술극장 대극장',
              festival: '서울아트마켓 PAMS',
              program_book_url: 'https://popok-sample-program-book.pdf',
              program_book_images: [
                '/images/placeholders/cake-placeholder.png'
              ]
            };
          }
          if (idx === 1) {
            return {
              ...work,
              venue: '경기아트센터 소극장',
              festival: '대한민국무용대상'
            };
          }
          return work;
        });
      }

      // Map JSON properties to Supabase column names
      const dbRow = {
        name: c.name,
        name_en: c.name_en || null,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: 'published', // Publish them so they show on homepage
        verified: true,
        genre: c.genre || null,
        category: c.category || null,
        city_or_region: c.city_or_region || null,
        bio_short: c.bio_short || null,
        bio: c.bio || null,
        profile_image_url: c.profile_image_url || null,
        profile_image_urls: Array.isArray(c.profile_image_urls) ? c.profile_image_urls : [],
        email: c.email || null,
        instagram: c.instagram || null,
        website: c.website || null,
        portfolio_url: c.portfolio_url || null,
        current_activity: c.current_activity || [],
        brand_color: brandColors[c.name] || null,
        mission: c.mission || null,
        vision: c.vision || null,
        core_values: c.core_values || [],
        founded_year: typeof c.founded_year === 'number' ? c.founded_year : null,
        history: c.history || [],
        view_count: typeof c.view_count === 'number' ? c.view_count : 0,
        works: companyWorks,
        awards: c.awards || [],
        review_links: c.review_links || [],
        links: c.links || []
      };

      // Check if company already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('name', c.name)
        .maybeSingle();

      if (existing) {
        console.log(`Company '${c.name}' already exists in DB (ID: ${existing.id}). Updating...`);
        const { error: updateError } = await supabase
          .from('companies')
          .update(dbRow)
          .eq('id', existing.id);
        if (updateError) {
          console.error(`Failed to update ${c.name}:`, updateError);
        } else {
          console.log(`Successfully updated ${c.name}.`);
        }
      } else {
        console.log(`Company '${c.name}' does not exist. Inserting...`);
        const { error: insertError } = await supabase
          .from('companies')
          .insert(dbRow);
        if (insertError) {
          console.error(`Failed to insert ${c.name}:`, insertError);
        } else {
          console.log(`Successfully inserted ${c.name}.`);
        }
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration crashed:", err);
  }
}

run();
