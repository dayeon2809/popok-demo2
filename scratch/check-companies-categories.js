const fs = require('fs');
const path = require('path');

const companiesPath = path.join(__dirname, '../companies-from-artists.json');

try {
  const content = fs.readFileSync(companiesPath, 'utf8');
  const companies = JSON.parse(content);

  const categories = {};
  companies.forEach(c => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });

  console.log('Categories count:', categories);
} catch (err) {
  console.error(err);
}
