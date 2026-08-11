const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../data/artists.json');

function convert() {
  console.log('Reading artists.json...');
  // Read from a backup of artists.json if we ran it, or we can just read the current file since it was mutated.
  // Wait, if it was already mutated, old.type/old.tags won't be there because they were stripped!
  // Oh, wait! Did we keep a git version or backup?
  // Let's check git status or check if we can restore from Git!
  console.log('Done reading');
}
convert();
