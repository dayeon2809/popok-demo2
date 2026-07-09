# POPOK Media Asset Management Guide (미디어 업로드 가이드)

이 문서는 개발자가 아니어도 아티스트의 프로필 사진, 모션 프로필 영상, 작품 이미지 및 영상 링크를 직접 파일에 복사하고 JSON 데이터 값을 수정하여 손쉽게 콘텐츠를 교체할 수 있도록 안내하는 가이드라인입니다.

---

## 📁 1. 미디어 파일 업로드 폴더 위치

프로젝트 내에 직접 업로드하는 이미지와 비디오 파일은 모두 `public/` 폴더 하위 경로에 위치해야 합니다.

### A. 아티스트 프로필 사진 위치
- **폴더 경로**: `public/images/artists/`
- **파일명 규칙**: 가능하면 아티스트의 고유 ID와 매치되도록 저장합니다.
- *예시*: `public/images/artists/yoon-kyunggeun.jpg`

### B. 작품 (Selected Works) 이미지 위치
- **폴더 경로**: `public/media/works/[work-id]/`
- *예시*: `public/media/works/ziohmboq-work1/cover.jpg`
- 또는 간편하게 `public/images/artists/` 안에 한 번에 모아서 관리해도 무방합니다.

### C. 모션 프로필 (Motion Profile) 비디오 & 커버 이미지 위치
- **폴더 경로**: `public/media/motion/[artist-id]/`
- *예시*: `public/media/motion/jian-choi/motion.mp4` (15초 분량의 영상)
- *예시*: `public/media/motion/jian-choi/cover.jpg` (영상 로딩 전 노출되는 커버 포스터 이미지)

---

## 📝 2. 데이터베이스 (`data/artists.json`) 수정 방법

아래 필드 구조를 참고하여 `data/artists.json` 파일의 해당하는 아티스트 레코드를 수정하세요.

### A. 모션 프로필 (Motion Profile) 비디오 연동
아티스트 오브젝트 내의 `motionProfile` 항목을 다음과 같이 작성합니다.

```json
"motionProfile": {
  "type": "video",
  "src": "/media/motion/jian-choi/motion.mp4",
  "poster": "/media/motion/jian-choi/cover.jpg",
  "title": "Motion Profile",
  "caption": "15 sec artist intro"
}
```

*※ 영상이 아직 준비되지 않고 이미지 줌 애니메이션 데모로 노출하려면 `type`을 `"image"`로 선언하고 `src`에 이미지 경로를 넣어주면 됩니다.*
```json
"motionProfile": {
  "type": "image",
  "src": "/media/motion/jian-choi/cover.jpg",
  "title": "Motion Profile",
  "caption": "Artist in motion"
}
```

---

### B. 작품별 미디어 링크 연동 (Bottom Sheet에 직접 임베드되어 재생됨)
각 작품 오브젝트에 `media` 필드를 아래 중 하나의 형태로 입력해 주면, 작품 상세 창(Bottom Sheet) 내부에서 영상 플레이어가 직접 로드됩니다.

#### 1) 유튜브 (YouTube) 영상을 임베드하는 경우
- **타입**: `youtube`
- **주소**: 단축 주소(`youtu.be`), 일반 동영상 주소, YouTube Shorts 주소 모두 지원됩니다.
```json
"media": {
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

#### 2) 비메오 (Vimeo) 영상을 임베드하는 경우
- **타입**: `vimeo`
- **주소**: 비메오 비디오 URL을 입력합니다.
```json
"media": {
  "type": "vimeo",
  "url": "https://vimeo.com/84938491"
}
```

#### 3) 직접 업로드한 비디오 파일 (Direct MP4)을 임베드하는 경우
- **타입**: `video`
- **주소**: `public/` 경로를 제외한 영상 경로와 포스터 이미지 경로를 적어줍니다.
```json
"media": {
  "type": "video",
  "src": "/media/works/ziohmboq-work1/video.mp4",
  "poster": "/media/works/ziohmboq-work1/cover.jpg"
}
```

#### 4) 영상 없이 이미지만 보여주는 경우
- **타입**: `image`
```json
"media": {
  "type": "image",
  "src": "/media/works/ziohmboq-work1/cover.jpg"
}
```

---

## 💡 3. 콘텐츠 교체 시나리오 (따라 해보기)

아티스트 **"이지수"**의 신규 모션 프로필과 작품 영상을 연동해 보겠습니다.

### STEP 1. 영상 파일 복사
1. 이지수의 15초 세로형 인트로 영상 파일을 `public/media/motion/demo-visual-1/motion.mp4` 경로에 붙여넣습니다.
2. 비디오 커버로 쓸 사진 파일을 `public/media/motion/demo-visual-1/cover.jpg` 경로에 붙여넣습니다.

### STEP 2. JSON 데이터 파일 열기
- `data/artists.json` 파일을 편집기로 엽니다.
- `"id": "demo-visual-1"` 인 이지수의 데이터 블록을 찾습니다.

### STEP 3. 모션 영상 필드 수정
이지수의 데이터 블록 안에 아래 코드를 추가하거나 수정합니다.
```json
"motionProfile": {
  "type": "video",
  "src": "/media/motion/demo-visual-1/motion.mp4",
  "poster": "/media/motion/demo-visual-1/cover.jpg"
}
```

### STEP 4. 작품 상세 영상(유튜브) 필드 수정
이지수의 첫 번째 작품에 유튜브 영상을 등록하기 위해 `portfolio_works` 또는 `works` 맵 안에 `media`를 추가합니다.
```json
"portfolio_works": [
  {
    "title": "빛의 숲 (2025)",
    "year": "2025",
    "description": "인터랙티브 테크놀로지를 활용한 빛의 전시입니다.",
    "role": "미디어 아티스트",
    "image_url": "/images/placeholders/cake-placeholder.png",
    "media": {
      "type": "youtube",
      "url": "https://youtu.be/g3-q7C4xK6E"
    }
  }
]
```

### STEP 5. 변경사항 저장
- JSON 파일을 저장하면 즉시 적용됩니다. 새로고침하여 이지수 아티스트 페이지에서 비디오 재생과 유튜브 임베드를 확인하세요!
