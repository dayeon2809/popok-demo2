const fs = require('fs');
const path = require('path');

const artistsPath = path.join(__dirname, '../data/artists.json');

try {
  const fileContent = fs.readFileSync(artistsPath, 'utf8');
  const artists = JSON.parse(fileContent);

  console.log('Total Artists:', artists.length);
  
  // Genres or roles? Let's check keys
  const roles = {};
  const genres = {};
  let totalWorks = 0;
  let choreographers = 0;
  let organizations = 0;

  artists.forEach(artist => {
    // Check role/type
    const type = artist.type || artist.artist_type || '';
    roles[type] = (roles[type] || 0) + 1;
    
    // Check works
    if (artist.works && Array.isArray(artist.works)) {
      totalWorks += artist.works.length;
    } else if (artist.portfolio_works && Array.isArray(artist.portfolio_works)) {
      totalWorks += artist.portfolio_works.length;
    }

    if (type.includes('personal') || type.includes('개인') || artist.role === '안무가' || artist.role === 'dancer') {
      choreographers++;
    }
  });

  console.log('Roles:', JSON.stringify(roles, null, 2));
  console.log('Total Works:', totalWorks);
  
  // Let's also read companies-from-artists.json to check total companies
  const companiesPath = path.join(__dirname, '../companies-from-artists.json');
  if (fs.existsSync(companiesPath)) {
    const compContent = fs.readFileSync(companiesPath, 'utf8');
    const companies = JSON.parse(compContent);
    console.log('Total Companies/Organizations:', companies.length);
  }
  
} catch (err) {
  console.error(err);
}
