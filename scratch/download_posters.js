const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('scratch/posters/manifest.json', 'utf8'));

function guessExtFromContentType(ct) {
  if (!ct) return null;
  if (ct.includes('jpeg')) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('webp')) return 'webp';
  return null;
}

async function main() {
  const results = [];
  for (const row of manifest) {
    if (!row.url) { results.push({ ...row, ok: false, error: 'no url' }); continue; }
    try {
      const u = new URL(row.url);
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
          'Referer': u.origin + '/',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
      if (!res.ok) {
        results.push({ ...row, ok: false, error: 'HTTP ' + res.status });
        continue;
      }
      const ct = res.headers.get('content-type');
      const ext = guessExtFromContentType(ct) || row.ext || 'jpg';
      const buf = Buffer.from(await res.arrayBuffer());
      const outPath = path.join('scratch', 'posters', `${row.name}.${ext}`);
      fs.writeFileSync(outPath, buf);
      results.push({ ...row, ok: true, contentType: ct, bytes: buf.length, file: outPath });
    } catch (e) {
      results.push({ ...row, ok: false, error: String(e.message || e) });
    }
  }
  fs.writeFileSync('scratch/posters/download_results.json', JSON.stringify(results, null, 2));
  for (const r of results) {
    console.log(r.ok ? 'OK  ' : 'FAIL', r.name, r.ok ? `${r.bytes}b ${r.contentType}` : r.error);
  }
}

main();
