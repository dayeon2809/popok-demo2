const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../data/artists.json');

function reconvert() {
  console.log('Reading artists.json...');
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const artists = JSON.parse(rawData);

  console.log(`Enriching ${artists.length} artists with type and tags...`);

  const enriched = artists.map(a => {
    // Determine type
    let type = 'individual';
    const textToTest = `${a.name} ${a.company}`.toLowerCase();
    
    if (
      textToTest.includes('무용단') || 
      textToTest.includes('발레단') || 
      textToTest.includes('예술단') || 
      textToTest.includes('무용회') || 
      textToTest.includes('company') || 
      textToTest.includes('컴퍼니') || 
      textToTest.includes('아트컴퍼니')
    ) {
      type = 'company';
    } else if (
      textToTest.includes('프로젝트') || 
      textToTest.includes('project') || 
      textToTest.includes('컬렉티브') || 
      textToTest.includes('collective')
    ) {
      type = 'project_group';
    }

    // Determine tags
    const tags = [];
    const typeMap = { individual: '안무가', company: '무용단', project_group: '프로젝트팀' };
    tags.push(typeMap[type]);

    if (a.field === 'dance') {
      if (a.genre === 'contemporary') tags.push('현대무용');
      else if (a.genre === 'korean') tags.push('한국무용');
      else if (a.genre === 'ballet') tags.push('발레');
    } else if (a.field === 'interdisciplinary') {
      tags.push('다원예술');
    }

    if (a.instagram) tags.push('SNS');
    if (a.website) tags.push('웹사이트');
    if (a.works && a.works.length >= 5) tags.push('다수작품');
    if (a.verified) tags.push('검증됨');

    return {
      ...a,
      type: type,
      tags: tags
    };
  });

  fs.writeFileSync(inputPath, JSON.stringify(enriched, null, 2), 'utf8');
  console.log('Done enriching artists.json!');
}

reconvert();
