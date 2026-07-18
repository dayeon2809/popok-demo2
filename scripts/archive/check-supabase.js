const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

async function run() {
  const supabase = createClient(
    env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.from('artists').select('*');
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log(`Total artists in Supabase: ${data.length}`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
