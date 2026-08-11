export const PROFILE_EXTRACTION_PROMPT = `
[이력 데이터 구조화 규칙]
이력서 원문에서 아티스트의 다음 기본 정보 및 연도별 활동 이력을 정확히 추출해 주세요:
1. artist:
   - name: 활동명/이름
   - name_en: 영문 활동명/이름 (없으면 "")
   - genre: 주 활동 분야 (예: 현대무용, 발레, 한국무용, 음악, 미술 등)
   - role: 주 역할 (예: 무용수, 안무가, 기획자, 단원, 예술감독 등)
2. affiliations: 소속 정보(단체명/기관명, 직책/역할)를 객체 배열로 추출합니다.
3. current_activity: 현재 재직 중이거나 상시 활동 중인 텍스트 목록을 추출합니다.
4. awards: 수상 경력을 추출합니다. (연도, 수상명, 수여기관, 결과 등)
5. competitions: 콩쿠르, 공모전 등 본선/결선 진출 이력을 추출합니다. (연도, 행사명, 주최기관, 결과 등)
6. education: 학력 정보를 정리합니다. (학교명, 전공, 학위 등)
7. links: 추출 가능한 외부 웹링크(인스타그램, 홈페이지 등)를 객체 배열로 추출합니다. (라벨과 URL)
8. 작품 또는 수상 정보에 포함된 source URL은 참고용 메타데이터가 아니라 사용자에게 노출되는 리뷰·기사 링크다. 작품과 연결 가능한 모든 source URL을 해당 작품의 reviewLinks에 빠짐없이 포함하라.
   - source, sources, review, reviewLink, article, articleUrl, 기사, 리뷰, 출처 필드의 URL을 모두 확인합니다.
   - [매체명] URL, [매체명](URL), 일반 URL 형식을 모두 인식합니다.
   - links에는 인스타그램, 유튜브, 링크드인, 개인 홈페이지, 공식 포트폴리오처럼 아티스트가 직접 운영하거나 공식 채널로 사용하는 링크만 넣습니다.
   - 작품의 기사·리뷰·언론 보도 source URL은 links에 넣지 말고 반드시 review_links에만 넣습니다.
   - affiliations의 소속 단체 URL은 작품 리뷰·기사 링크로 분류하지 않습니다.
   - 결과 JSON에서는 실제 저장 필드인 review_links에 { title, publication, work, url, year } 형태로 반환합니다.

모든 연도(year) 정보는 문자열(string)로 변환해 주세요. (예: "2026", "2025"). 모르는 정보는 null 또는 빈 배열 []을 사용해야 합니다.
`;
