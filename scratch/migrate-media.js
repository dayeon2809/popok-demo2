const fs = require('fs');
const path = require('path');

// 1. Hangul Romanization Helper
function romanizeKorean(str) {
  const choMap = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  const jungMap = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'ye', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  const jongMap = ['', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'];

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const jong = offset % 28;
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const cho = Math.floor(offset / (21 * 28));
      result += choMap[cho] + jungMap[jung] + jongMap[jong];
    } else {
      result += str[i];
    }
  }
  return result;
}

// 2. Slugifier
function slugify(text) {
  if (!text) return '';
  let rom = romanizeKorean(text);
  return rom
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except space/hyphen
    .trim()
    .replace(/[\s_]+/g, '-')       // replace spaces/underscores with hyphens
    .replace(/-+/g, '-');          // remove consecutive hyphens
}

// 3. Known Manual Work Slugs
const manualSlugs = {
  "바디콘서트": "body-concert",
  "99.9": "99-9",
  "ASAC 몸짓콘서트": "asac-momjit-concert",
  "무교육적 대스": "non-educational-dance",
  "무교육적 댄스": "non-educational-dance",
  "언어학(Linguistics)": "linguistics",
  "틈": "teum",
  "홈라당": "homradang",
  "Pan_Opticon": "pan-opticon",
  "SAL 공연": "sal-performance",
  "엠비규어스댄스컴퍼니 공연": "ambiguous-dance-company-performance"
};

function migrate() {
  console.log('🚀 Starting Media & JSON Reorganization (Corrected)...');

  const workspaceRoot = path.join(__dirname, '..');
  const artistsJsonPath = path.join(workspaceRoot, 'data', 'artists.json');
  const backupJsonPath = path.join(workspaceRoot, 'data', 'artists.json.bak');

  if (!fs.existsSync(artistsJsonPath)) {
    console.error(`❌ Error: Could not find artists.json at ${artistsJsonPath}`);
    process.exit(1);
  }

  const artists = JSON.parse(fs.readFileSync(artistsJsonPath, 'utf8'));

  const filesToMove = []; // Array of { src, dest, deleteSource }
  const movedFilesSummary = [];
  const updatedJsonPaths = [];
  const generatedWorksMeta = [];

  artists.forEach(artist => {
    const artistId = artist.id;
    console.log(`\n👤 Processing Artist: ${artist.name} (${artistId})`);

    // A. Migrate portfolio_works to works (overwriting legacy string array if any)
    if (artist.portfolio_works) {
      artist.works = artist.portfolio_works;
      delete artist.portfolio_works;
      console.log(`  - Migrated 'portfolio_works' to 'works' (overwrote legacy string list)`);
    }

    // B. Migrate Profile Image
    if (artist.profileImage && artist.profileImage.startsWith('/')) {
      if (artist.profileImage.startsWith(`/media/artists/${artistId}/profile`)) {
        console.log(`  - Profile image already in new format: ${artist.profileImage}`);
      } else {
        const ext = path.extname(artist.profileImage) || '.jpg';
        const originalPath = path.join(workspaceRoot, 'public', artist.profileImage);
        const targetPath = path.join(workspaceRoot, 'public', 'media', 'artists', artistId, `profile${ext}`);
        const webPath = `/media/artists/${artistId}/profile${ext}`;

        filesToMove.push({ src: originalPath, dest: targetPath, deleteSource: true });
        artist.profileImage = webPath;
        updatedJsonPaths.push({ artist: artistId, field: 'profileImage', path: webPath });
      }
    }

    // C. Migrate works
    if (artist.works && Array.isArray(artist.works)) {
      const assignedSlugs = new Set();

      artist.works.forEach((work, index) => {
        const workIndex = index + 1;
        
        // Skip string elements if any legacy array was left unconverted
        if (typeof work === 'string') {
          console.warn(`  ⚠️ Warning: found legacy string in works list: "${work}"`);
          return;
        }

        // Assign stable artist-prefixed ID if not exists
        if (!work.id || !work.id.startsWith(artistId + '-')) {
          work.id = `${artistId}-${String(workIndex).padStart(3, '0')}`;
        }

        // Generate and assign unique slug per artist if not exists
        if (!work.slug) {
          let baseSlug = manualSlugs[work.title] || slugify(work.title) || `work-${workIndex}`;
          let uniqueSlug = baseSlug;
          let counter = 1;
          while (assignedSlugs.has(uniqueSlug)) {
            counter++;
            uniqueSlug = `${baseSlug}-${counter}`;
          }
          work.slug = uniqueSlug;
        }
        assignedSlugs.add(work.slug);
        generatedWorksMeta.push({ artist: artistId, id: work.id, slug: work.slug, title: work.title });

        // Clean up multi-image legacy fields if any
        if (work.image_urls) delete work.image_urls;
        if (work.gallery) delete work.gallery;
        if (work.gallery_image_urls) delete work.gallery_image_urls;

        // Handle image_url migration
        if (work.image_url && work.image_url.startsWith('/')) {
          if (work.image_url.startsWith(`/media/works/${artistId}/${work.slug}/image`)) {
            // Already migrated (idempotency)
          } else {
            const ext = path.extname(work.image_url) || '.jpg';
            const originalPath = path.join(workspaceRoot, 'public', work.image_url);
            const targetPath = path.join(workspaceRoot, 'public', 'media', 'works', artistId, work.slug, `image${ext}`);
            const webPath = `/media/works/${artistId}/${work.slug}/image${ext}`;

            // Check if original file is profile image. If it is profile image, copy but don't delete.
            const isProfileImage = artist.profileImage && artist.profileImage.includes(path.basename(work.image_url));
            filesToMove.push({ src: originalPath, dest: targetPath, deleteSource: !isProfileImage });

            work.image_url = webPath;
            updatedJsonPaths.push({ artist: artistId, work: work.slug, field: 'image_url', path: webPath });
          }
        }

        // D. Special Inference for kim-boram unlinked files
        if (!work.image_url && artistId === 'kim-boram') {
          const legacyDir = path.join(workspaceRoot, 'public', 'media', 'works', 'kim-boram');
          if (fs.existsSync(legacyDir)) {
            const files = fs.readdirSync(legacyDir);
            let matchedFile = null;
            if (work.slug === 'body-concert') matchedFile = files.find(f => f.startsWith('body-concert'));
            else if (work.slug === '99-9') matchedFile = files.find(f => f.startsWith('99.9'));
            else if (work.slug === 'asac-momjit-concert') matchedFile = files.find(f => f.startsWith('asac'));
            else if (work.slug === 'non-educational-dance') matchedFile = files.find(f => f.startsWith('무교육적'));
            else if (work.slug === 'teum') matchedFile = files.find(f => f.startsWith('틈'));
            else if (work.slug === 'homradang') matchedFile = files.find(f => f.startsWith('홈라당'));

            if (matchedFile) {
              const ext = path.extname(matchedFile);
              const originalPath = path.join(legacyDir, matchedFile);
              const targetPath = path.join(workspaceRoot, 'public', 'media', 'works', artistId, work.slug, `image${ext}`);
              const webPath = `/media/works/${artistId}/${work.slug}/image${ext}`;

              filesToMove.push({ src: originalPath, dest: targetPath, deleteSource: true });
              work.image_url = webPath;
              updatedJsonPaths.push({ artist: artistId, work: work.slug, field: 'image_url (inferred)', path: webPath });
            }
          }
        }
      });
    }
  });

  // Execute safe file moves
  console.log(`\n📂 Copying files to new targets...`);
  const sourcesToDelete = [];

  filesToMove.forEach(item => {
    if (!fs.existsSync(item.src)) {
      console.log(`  ⚠️ Source file not found, skipping: ${item.src}`);
      return;
    }

    if (fs.existsSync(item.dest)) {
      console.log(`  ⏭️ Target already exists, skipping: ${item.dest}`);
      if (item.deleteSource) {
        sourcesToDelete.push(item.src);
      }
      return;
    }

    const destDir = path.dirname(item.dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    try {
      fs.copyFileSync(item.src, item.dest);
      if (fs.existsSync(item.dest)) {
        movedFilesSummary.push({ from: item.src.replace(workspaceRoot, ''), to: item.dest.replace(workspaceRoot, '') });
        if (item.deleteSource) {
          sourcesToDelete.push(item.src);
        }
      }
    } catch (err) {
      console.error(`  ❌ Failed to copy file: ${item.src} -> ${item.dest}: ${err.message}`);
    }
  });

  // Verify and delete original source files
  console.log(`\n🧹 Cleaning up verified original files...`);
  sourcesToDelete.forEach(src => {
    if (fs.existsSync(src)) {
      try {
        fs.unlinkSync(src);
        console.log(`  🗑️ Deleted original: ${src.replace(workspaceRoot, '')}`);
      } catch (err) {
        console.error(`  ⚠️ Failed to delete original file ${src}: ${err.message}`);
      }
    }
  });

  // Write updated JSON back to artists.json
  fs.writeFileSync(artistsJsonPath, JSON.stringify(artists, null, 2), 'utf8');
  console.log(`\n📝 Updated data/artists.json`);

  console.log('\n📊 Migration Summary:');
  console.log(`- Total Files Copy-Moved: ${movedFilesSummary.length}`);
  console.log(`- Total JSON Mappings Updated: ${updatedJsonPaths.length}`);
  console.log(`- Total Works IDs/Slugs mapped: ${generatedWorksMeta.length}`);
  console.log('✅ Migration completed successfully!');
}

migrate();
