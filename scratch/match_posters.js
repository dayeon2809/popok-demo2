const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/perf_range.json', 'utf8'));

function norm(s) {
  return (s || '')
    .replace(/[〈〉<>［］\[\]（）()‘’'"]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function findBest(titleQuery, dateISO, venueQuery) {
  const nq = norm(titleQuery);
  const candidates = data.filter(d => d.start_date === dateISO);
  let best = null;
  for (const d of candidates) {
    const nt = norm(d.title);
    if (nt.includes(nq) || nq.includes(nt)) {
      if (!d.poster_url) continue;
      if (venueQuery && d.venue && norm(d.venue) !== norm(venueQuery)) continue;
      best = d;
      break;
    }
  }
  if (!best) {
    // relax venue constraint
    for (const d of candidates) {
      const nt = norm(d.title);
      if ((nt.includes(nq) || nq.includes(nt)) && d.poster_url) { best = d; break; }
    }
  }
  return best;
}

// [section, slideName, posterFrameId, title, dateISO, venue]
const queries = [
  // Card News 32
  ['32','Slide 02','558:1649','헬리움 HELIUM','2026-08-26','대구문화예술회관 팔공홀 (대극장)'],
  ['32','Slide 04','558:1732','다담','2026-08-26','우면당'],
  ['32','Slide 05','654:537','국악과 함께하는 문화가 있는 날','2026-08-26','국악박물관'],
  ['32','Slide 06','558:1819','2026 토요명품','2026-08-29','우면당'],
  ['32','Slide 07','558:1860','우면산별밤축제','2026-08-29','연희마당'],
  ['32','Slide 08','654:578','아리랑_당신의 노래','2026-08-25','국악박물관'],
  ['32','Slide 09','558:1947','아리랑_당신의 노래','2026-08-28','국악박물관'],
  // Card News 33
  ['33','Slide 02','660:524','토마스 눈 무용단','2026-09-03','강동아트센터 소극장 드림'],
  ['33','Slide 03','660:566','카셀주립무용단','2026-09-04','나루아트센터 대공연장'],
  ['33','Slide 04','660:607','태국','2026-09-04','국립극장 하늘극장'],
  ['33','Slide 05','660:787','코레오 커넥션','2026-09-04','국립아시아문화전당'],
  ['33','Slide 06','660:648','시네쿠아논아트','2026-09-05','강동아트센터 대극장 한강'],
  ['33','Slide 07','660:689','정보경댄스프로덕션','2026-09-06','나루아트센터 대공연장'],
  ['33','Slide 09','660:730','국악과 함께하는 문화가 있는 날','2026-09-02','국악박물관'],
  // Card News 34
  ['34','Slide 02','660:897','열혈예술청년단','2026-09-08','나루아트센터 스페이스76(전시실)'],
  ['34','Slide 03','660:939','아함아트프로젝트','2026-09-08','나루아트센터 대공연장'],
  ['34','Slide 04','660:980','무감서기','2026-09-10','세종문화회관 대극장'],
  ['34','Slide 05','660:1160','위 홀드 더 라인','2026-09-11','나루아트센터 스페이스76(전시실)'],
  ['34','Slide 06','660:1021','춤추다추임','2026-09-12','나루아트센터 대공연장'],
  ['34','Slide 07','660:1062','판타지 가족무용극','2026-09-12','성남아트리움 대극장'],
  ['34','Slide 09','660:1103','토요국악동화','2026-09-12','풍류사랑방'],
];

const results = [];
for (const [section, slide, frameId, title, dateISO, venue] of queries) {
  const match = findBest(title, dateISO, venue);
  results.push({
    section, slide, frameId, queryTitle: title, dateISO, venue,
    matched: match ? { title: match.title, venue: match.venue, poster_url: match.poster_url } : null,
  });
}

// standing program 무용x기술 창작랩 for card32 Slide03, card33 Slide08, card34 Slide08
const standing = 'https://www.kncdc.kr/mnt/files/board/2026/01/1767761493086';
results.push({ section: '32', slide: 'Slide 03', frameId: '558:1691', matched: { poster_url: standing } });
results.push({ section: '33', slide: 'Slide 08', frameId: '660:828', matched: { poster_url: standing } });
results.push({ section: '34', slide: 'Slide 08', frameId: '660:1201', matched: { poster_url: standing } });

for (const r of results) {
  console.log(r.section, r.slide, r.frameId, '=>', r.matched ? r.matched.poster_url : 'NO MATCH', r.matched ? '('+r.matched.title+')' : '');
}

fs.writeFileSync('scratch/poster_matches.json', JSON.stringify(results, null, 2));
