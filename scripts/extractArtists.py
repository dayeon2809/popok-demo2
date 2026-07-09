#!/usr/bin/env python3
"""
Piece of Cake - Artist DB 데이터 추출 스크립트
"""

import os, re, json, hashlib
from pathlib import Path
from datetime import datetime

VAULT_PATH = "/home/claude/vault_raw/obsidian_vault_dance"
OUTPUT_PATH = "/home/claude/piece-of-cake/data/artists.json"

def slugify(name):
    h = hashlib.md5(name.encode()).hexdigest()[:8]
    clean = re.sub(r'[^\w가-힣a-zA-Z0-9\s-]', '', name).strip()
    clean = re.sub(r'[\s]+', '-', clean)
    return f"{clean}-{h}"[:80]

def extract_instagram(text):
    m = re.search(r'https?://(?:www\.)?instagram\.com/[^\s\)\]\'"<>]+', text)
    return m.group(0).rstrip('.,)') if m else None

def extract_website(text):
    skip = ['instagram.com','dancepostkorea','koreadance.kr','facebook.com','naver.com','daum.net']
    patterns = [
        r'https?://linktr\.ee/[^\s\)\]\'"<>]+',
        r'https?://(?:www\.)?linktree\.[^\s\)\]\'"<>]+',
        r'https?://(?:www\.)?vimeo\.com/[^\s\)\]\'"<>]+',
        r'https?://[^\s\)\]\'"<>]+',
    ]
    for pat in patterns:
        for m in re.finditer(pat, text):
            url = m.group(0).rstrip('.,)')
            if not any(s in url for s in skip):
                return url
    return None

def parse_frontmatter(content):
    """H1 이후의 --- ... --- frontmatter 파싱"""
    # H1 뒤에 오는 frontmatter
    fm_match = re.search(r'\n---\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        return {}
    fm_text = fm_match.group(1)
    result = {}
    for line in fm_text.splitlines():
        if ':' in line:
            k, _, v = line.partition(':')
            result[k.strip()] = v.strip().strip('"')
    return result

def parse_choreographer_file(filepath):
    try:
        content = Path(filepath).read_text(encoding='utf-8', errors='replace')
    except:
        return None

    # 이름 (H1)
    name_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if not name_match:
        return None
    name = name_match.group(1).strip()
    
    artist = {
        "id": slugify(name),
        "name": name,
        "name_en": "",
        "type": "individual",
        "field": "unknown",
        "bio_short": "",
        "works": [],
        "representative_work": "",
        "year": None,
        "organization_or_affiliation": "",
        "festival_or_venue": "",
        "city_or_region": "",
        "website_url": None,
        "instagram_url": None,
        "video_url": None,
        "source_url": None,
        "source_file": os.path.basename(filepath),
        "tags": [],
        "verification_status": "needs_review",
        "related_articles": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    
    # 영문 이름 분리
    en_part = re.search(r'([A-Za-z][A-Za-z\s\.\-\']+)', name)
    ko_part = re.search(r'([가-힣]+)', name)
    if en_part:
        artist["name_en"] = en_part.group(1).strip()
    
    # 단체 타입 감지
    if any(x in content for x in ['무용단', '발레단', '예술단', '무용회', 'Company', '컴퍼니', '아트컴퍼니']):
        artist["type"] = "company"
    elif any(x in content for x in ['프로젝트', 'Project', '컬렉티브', 'Collective', '댄스프로젝트']):
        artist["type"] = "project_group"
    
    # Works 섹션
    works_m = re.search(r'## Works\s*\n(.*?)(?=\n##|\Z)', content, re.DOTALL)
    if works_m:
        works_text = works_m.group(1)
        work_items = re.findall(r'\[\[([^\]]+)\]\]', works_text)
        for w in work_items:
            w = w.strip()
            if not w or '없음' in w:
                continue
            yr = re.search(r'\b(19|20)\d{2}\b', w)
            artist["works"].append({
                "title": w,
                "year": int(yr.group(0)) if yr else None,
                "role": "choreographer",
                "venue": "",
                "festival": "",
                "source_url": ""
            })
    
    # Related Articles 섹션
    arts_m = re.search(r'## Related Articles\s*\n(.*?)(?=\n##|\Z)', content, re.DOTALL)
    if arts_m:
        arts = re.findall(r'\[\[([^\]]+)\]\]', arts_m.group(1))
        artist["related_articles"] = arts
    
    # 링크 추출
    artist["instagram_url"] = extract_instagram(content)
    artist["website_url"] = extract_website(content)
    
    # verification
    has_works = len(artist["works"]) > 0
    has_articles = len(artist["related_articles"]) > 0
    if has_works or has_articles:
        artist["verification_status"] = "verified"
    
    if artist["works"]:
        artist["representative_work"] = artist["works"][0]["title"]
    
    return artist

def enrich_from_articles(artists_list, vault_path):
    """기사 파일에서 추가 정보 추출"""
    # 이름 → index 매핑
    name_map = {}
    for i, a in enumerate(artists_list):
        name_map[a["name"]] = i
        if a.get("name_en"):
            name_map[a["name_en"]] = i
    
    article_dirs = [
        os.path.join(vault_path, "articles", "dancepostkorea"),
        os.path.join(vault_path, "articles", "dancewebzine"),
        os.path.join(vault_path, "articles", "thepreview"),
    ]
    
    processed = 0
    for adir in article_dirs:
        if not os.path.exists(adir):
            continue
        for fname in os.listdir(adir):
            if not fname.endswith('.md'):
                continue
            fpath = os.path.join(adir, fname)
            try:
                content = Path(fpath).read_text(encoding='utf-8', errors='replace')
            except:
                continue
            
            # frontmatter에서 choreographer 찾기
            choreo_matches = re.findall(r'choreographer:\s*\[\[([^\]]+)\]\]', content)
            venue_matches = re.findall(r'venue:\s*\[\[([^\]]+)\]\]', content)
            date_matches = re.findall(r'date:\s*(\d{4})', content)
            src_matches = re.findall(r'source_url:\s*(https?://[^\s\n\r]+)', content)
            
            venue = venue_matches[0] if venue_matches else ""
            year = int(date_matches[0]) if date_matches else None
            src = src_matches[0] if src_matches else ""
            
            # 작품명 추출
            work_title_m = re.search(r'[〈《]([^〉》\n]+)[〉》]', content[:300])
            work_title = work_title_m.group(1).strip() if work_title_m else ""
            
            instagram = extract_instagram(content)
            website = extract_website(content)
            
            for choreo in choreo_matches:
                choreo = choreo.strip()
                if choreo not in name_map:
                    continue
                idx = name_map[choreo]
                a = artists_list[idx]
                
                if instagram and not a["instagram_url"]:
                    a["instagram_url"] = instagram
                if website and not a["website_url"]:
                    a["website_url"] = website
                if venue and not a["festival_or_venue"]:
                    a["festival_or_venue"] = venue
                if year and not a["year"]:
                    a["year"] = year
                    
                # works 보강
                for w in a["works"]:
                    if work_title and (work_title in w["title"] or w["title"] in work_title):
                        if not w["venue"]: w["venue"] = venue
                        if not w["year"] and year: w["year"] = year
                        if not w["source_url"] and src: w["source_url"] = src
            
            processed += 1
    
    print(f"  기사 {processed}개 처리")

def determine_field(a):
    text = f"{a['name']} {a['representative_work']} {' '.join(w['title'] for w in a['works'])} {a['organization_or_affiliation']}".lower()
    if any(x in text for x in ['발레','ballet','국립발레','서울발레']):
        return "ballet"
    if any(x in text for x in ['한국무용','한국춤','전통춤','민속','국악','궁중','살풀이','입춤','태평무','처용','승무','부채춤']):
        return "korean_dance"
    if any(x in text for x in ['현대무용','컨템포러리','contemporary','현대춤','모던']):
        return "contemporary_dance"
    if any(x in text for x in ['다원','미디어','인터랙티브','interdisciplinary','퍼포먼스아트']):
        return "interdisciplinary"
    return "unknown"

def make_tags(a):
    tags = []
    type_map = {"individual":"안무가","company":"무용단","project_group":"프로젝트팀"}
    tags.append(type_map.get(a["type"],"안무가"))
    field_map = {"ballet":"발레","korean_dance":"한국무용","contemporary_dance":"현대무용","interdisciplinary":"다원예술"}
    if a["field"] in field_map:
        tags.append(field_map[a["field"]])
    if a["instagram_url"]: tags.append("SNS")
    if a["website_url"]: tags.append("웹사이트")
    if len(a["works"]) >= 5: tags.append("다수작품")
    if a["verification_status"] == "verified": tags.append("검증됨")
    return tags

def main():
    print("=== Piece of Cake: Artist DB 추출 ===\n")
    
    choreo_dir = os.path.join(VAULT_PATH, "choreographers")
    files = list(Path(choreo_dir).glob("*.md"))
    print(f"1. 안무가 파일 {len(files)}개 파싱 중...")
    
    artists = []
    seen_names = {}
    for fpath in files:
        a = parse_choreographer_file(str(fpath))
        if not a or not a["name"]:
            continue
        if a["name"] in seen_names:
            # 중복 → needs_review
            artists[seen_names[a["name"]]]["verification_status"] = "needs_review"
            continue
        seen_names[a["name"]] = len(artists)
        artists.append(a)
    
    print(f"   파싱됨: {len(artists)}명")
    
    print("\n2. 기사 보강 중...")
    enrich_from_articles(artists, VAULT_PATH)
    
    print("\n3. 분야 판별 및 태그 생성...")
    for a in artists:
        a["field"] = determine_field(a)
        a["tags"] = make_tags(a)
    
    # 필터: works도 articles도 없는 것 제거
    before = len(artists)
    artists = [a for a in artists if a["works"] or a["related_articles"]]
    print(f"\n4. 필터링: {before - len(artists)}명 제거 → 최종 {len(artists)}명")
    
    # 통계
    print(f"\n   verified: {sum(1 for a in artists if a['verification_status']=='verified')}")
    print(f"   needs_review: {sum(1 for a in artists if a['verification_status']=='needs_review')}")
    print(f"   개인: {sum(1 for a in artists if a['type']=='individual')}")
    print(f"   단체: {sum(1 for a in artists if a['type']=='company')}")
    print(f"   프로젝트: {sum(1 for a in artists if a['type']=='project_group')}")
    field_counts = {}
    for a in artists:
        field_counts[a["field"]] = field_counts.get(a["field"], 0) + 1
    for k,v in sorted(field_counts.items(), key=lambda x: -x[1]):
        print(f"   {k}: {v}")
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(artists, f, ensure_ascii=False, indent=2)
    
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"\n✅ {OUTPUT_PATH} ({size_kb:.0f} KB)")

if __name__ == "__main__":
    main()
