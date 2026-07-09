import { ArtistWithWorks } from "@/types";
import artistsData from "../data/artists.json";

// Demo/Sample profiles for MUSIC and VISUAL (isDemo: true, clear sample data)
const demoArtists: ArtistWithWorks[] = [
  {
    id: "demo-music-1",
    recordId: "demo-music-1",
    name: "김재우",
    name_en: "Jaewoo Kim",
    company: "사운드랩 울림",
    bio: "공간과 소리의 상호작용을 연구하며 일상의 소음을 예술로 승화시키는 사운드 아트 작업을 하고 있습니다. 관객이 공간 안에서 느끼는 청각적 경험의 깊이를 시각과 융합하는 실험을 이어갑니다.",
    bio_short: "공간의 주파수를 빚는 사운드 아티스트",
    works: [
      "<도시의 파동 (2025)>",
      "<잔향의 궤적 (2024)>"
    ],
    field: "music",
    genre: "sound art",
    role: "사운드 디자이너",
    type: "individual",
    instagram: "https://www.instagram.com/jaewoo_sound",
    website: "",
    profileImage: "",
    residency: ["2024 금천예술공장 입주작가"],
    festival: ["2024 서울사운드아트 페스티벌"],
    status: "published",
    verified: true,
    aiSummary: "김재우는 사운드 디자인과 예술적 소음의 경계를 넘나들며, 관객에게 고유한 청각적 경험을 제공하는 작가입니다.",
    reviews: [],
    isDemo: true,
    tags: ["음악", "사운드아트", "개인", "검증됨"],
    motionProfile: {
      type: "image",
      src: "/images/placeholders/cake-placeholder.png",
      title: "Sound Resonance",
      caption: "Interactive sound design visual mockup"
    }
  },
  {
    id: "demo-music-2",
    recordId: "demo-music-2",
    name: "서은하",
    name_en: "Eunha Seo",
    company: "Ensemble Echo",
    bio: "클래식의 견고한 구조 위에 현대적인 전자 신디사이저 사운드를 접목하여, 대중에게 신선하고 평온한 위로를 주는 뉴에이지 연주곡을 작곡합니다.",
    bio_short: "피아노 선율과 뉴에이지의 조화",
    works: [
      "<겨울 해넘이 (2025)>",
      "<푸른 밤의 정원 (2023)>"
    ],
    field: "music",
    genre: "composition",
    role: "작곡가 / 피아니스트",
    type: "individual",
    instagram: "https://www.instagram.com/eunha_piano",
    website: "",
    profileImage: "",
    residency: ["2023 백남준아트센터 공연 매핑 프로젝트"],
    festival: ["2023 제주 뉴에이지 뮤직 나잇"],
    status: "published",
    verified: true,
    aiSummary: "서은하는 어쿠스틱 피아노 사운드와 미니멀한 앰비언트 신스를 결합하는 작곡가입니다.",
    reviews: [],
    isDemo: true,
    tags: ["음악", "작곡", "피아노", "개인", "검증됨"]
  },
  {
    id: "demo-music-3",
    recordId: "demo-music-3",
    name: "앙상블 뮤즈",
    name_en: "Ensemble Muse",
    company: "앙상블 뮤즈",
    bio: "목관 5중주의 매력을 현대적으로 재해석하여 대중과 밀접하게 소통하는 실내악 단체입니다. 현대 작곡가들의 신곡 위촉 연주 및 융합 예술 공연을 활발히 이어갑니다.",
    bio_short: "목관 5중주 현대 음악 앙상블",
    works: [
      "<바람의 변주곡 (2024)>",
      "<봄의 숨결 (2025)>"
    ],
    field: "music",
    genre: "ensemble",
    role: "실내악 단체",
    type: "group",
    instagram: "https://www.instagram.com/ensemble_muse",
    website: "",
    profileImage: "",
    residency: [],
    festival: ["2024 통영국제음악제 프린지"],
    status: "published",
    verified: true,
    aiSummary: "앙상블 뮤즈는 정통 클래식을 기반으로 목관 5중주 연주 방식의 경계를 확장하는 실내악 그룹입니다.",
    reviews: [],
    isDemo: true,
    tags: ["음악", "실내악", "그룹", "검증됨"]
  },
  {
    id: "demo-visual-1",
    recordId: "demo-visual-1",
    name: "이지수",
    name_en: "Jisu Lee",
    company: "스튜디오 라이트",
    bio: "인터랙티브 빛과 테크놀로지를 활용해 인간의 신체 감각과 기억의 관계를 탐구하는 미디어 아트 작업을 하고 있습니다. 디지털 디스플레이와 광학 거울을 결합한 독특한 조형을 만듭니다.",
    bio_short: "인터랙티브 빛의 시각 예술가",
    works: [
      "<빛의 숲 (2025)>",
      "<감정의 온도 (2024)>"
    ],
    field: "visual",
    genre: "media art",
    role: "미디어 아티스트",
    type: "individual",
    instagram: "https://www.instagram.com/jisu_media",
    website: "",
    profileImage: "",
    residency: ["2024 국립현대미술관 창동레지던시"],
    festival: ["2024 광주미디어아트 페스티벌"],
    status: "published",
    verified: true,
    aiSummary: "이지수는 테크놀로지 매체를 예술과 연결하여 관객의 직접적인 반응과 감정을 공간 전체에 시각화합니다.",
    reviews: [],
    isDemo: true,
    tags: ["시각", "미디어아트", "개인", "검증됨"]
  },
  {
    id: "demo-visual-2",
    recordId: "demo-visual-2",
    name: "한도윤",
    name_en: "Doyun Han",
    company: "한도윤 스튜디오",
    bio: "빠르게 변해가는 도시 속에서 방치되고 소외된 아날로그 공간들을 흑백 필름 사진으로 조용히 담아내는 아카이빙 사진작가입니다. 필름 노출과 실버 프린트 공정을 직접 수행하여 고유의 톤을 만들어냅니다.",
    bio_short: "시간의 여백을 기록하는 사진작가",
    works: [
      "<도시의 유령 (2024)>",
      "<침묵의 벽 (2025)>"
    ],
    field: "visual",
    genre: "photography",
    role: "사진작가",
    type: "individual",
    instagram: "https://www.instagram.com/doyun_photo",
    website: "",
    profileImage: "",
    residency: ["2023 서울문화재단 예술창작지원"],
    festival: ["2024 대구사진비엔날레 포트폴리오 리뷰"],
    status: "published",
    verified: true,
    aiSummary: "한도윤은 흑백 필름 특유의 질감과 콘트라스트를 사용하여 정적인 피사체에서 깊은 서사를 이끌어냅니다.",
    reviews: [],
    isDemo: true,
    tags: ["시각", "사진", "개인", "검증됨"]
  },
  {
    id: "demo-visual-3",
    recordId: "demo-visual-3",
    name: "콜렉티브 숨",
    name_en: "Collective SOOM",
    company: "Collective SOOM",
    bio: "건축, 조형, 시각디자인 작가들이 결성한 프로젝트 아트 그룹으로 폐기되는 건축용 재료들을 수집해 대형 환경 설치 조형물로 승화시키는 작업을 지속해 오고 있습니다.",
    bio_short: "순환 예술을 지향하는 설치 그룹",
    works: [
      "<다시 태어난 방 (2025)>",
      "<지구의 숨결 (2024)>"
    ],
    field: "visual",
    genre: "installation",
    role: "설치미술 콜렉티브",
    type: "group",
    instagram: "https://www.instagram.com/collective_soom",
    website: "",
    profileImage: "",
    residency: [],
    festival: ["2024 에코아트 비엔날레"],
    status: "published",
    verified: true,
    aiSummary: "콜렉티브 숨은 생태학적 지속 가능성과 조형 디자인을 융합하는 실험 미술 단체입니다.",
    reviews: [],
    isDemo: true,
    tags: ["시각", "설치미술", "그룹", "검증됨"]
  }
];

// recordId가 없는 로컬 데이터에 id를 recordId로 복사해서 매핑하고 demo 데이터와 합칩니다.
export const artists: ArtistWithWorks[] = [
  ...(artistsData as any[]).map((a) => ({
    ...a,
    recordId: a.recordId || a.id,
    field: a.field || "dance", // 기존 데이터는 기본적으로 무용(dance)으로 취급
  })),
  ...demoArtists
] as ArtistWithWorks[];

export function getArtist(id: string): ArtistWithWorks | undefined {
  if (!id) return undefined;
  
  // URL 인코딩 대응
  const decoded = decodeURIComponent(id).trim().toLowerCase();

  return artists.find((a) => {
    const aId = (a.id || "").trim().toLowerCase();
    const aRecordId = (a.recordId || "").trim().toLowerCase();
    const aName = (a.name || "").trim().toLowerCase();
    const aNameEn = (a.name_en || "").trim().toLowerCase();
    const aSlug = (a.slug || "").trim().toLowerCase();

    // 1) ID 또는 recordId 또는 slug가 정확히 일치하는지 확인
    if (aId === decoded || aRecordId === decoded || aSlug === decoded) {
      return true;
    }
    
    // 2) 한글/영문 이름이 공백을 제거하고 정확히 일치하는지 확인
    const cleanName = aName.replace(/\s+/g, "");
    const cleanNameEn = aNameEn.replace(/\s+/g, "");
    const cleanDecoded = decoded.replace(/\s+/g, "");
    if (cleanName === cleanDecoded || cleanNameEn === cleanDecoded) {
      return true;
    }
    
    // 3) ID에 이름이 포함되어 있는 경우
    if (aId.includes(cleanDecoded) && cleanDecoded.length >= 2) {
      return true;
    }

    return false;
  });
}

export function searchArtists(
  query: string,
  typeFilter: string,
  fieldFilter: string
): ArtistWithWorks[] {
  let results = artists.filter((a) => !a.status || a.status === "published");

  // 1. Type Filter Mapping: ALL TYPE, INDIVIDUAL, GROUP/TEAM
  if (typeFilter && typeFilter !== "all") {
    results = results.filter((a) => {
      const type = a.type || (a.company ? "company" : "individual");
      if (typeFilter === "individual") {
        return type === "individual";
      }
      if (typeFilter === "group") {
        return type === "company" || type === "project_group" || type === "group";
      }
      return true;
    });
  }

  // 2. Category Filter Mapping: DANCE, MUSIC, VISUAL
  if (fieldFilter && fieldFilter !== "all") {
    results = results.filter((a) => {
      const field = a.field || "dance";
      
      // Category DANCE
      if (fieldFilter === "dance") {
        return field === "dance" || field === "contemporary_dance" || field === "korean_dance" || field === "ballet" || field === "interdisciplinary";
      }
      // Category MUSIC
      if (fieldFilter === "music") {
        return field === "music";
      }
      // Category VISUAL
      if (fieldFilter === "visual") {
        return field === "visual";
      }

      // Sub-genres within Dance Category
      if (fieldFilter === "contemporary") {
        return a.genre === "contemporary" || a.genre === "contemporary_dance";
      }
      if (fieldFilter === "ballet") {
        return a.genre === "ballet";
      }
      if (fieldFilter === "korean") {
        return a.genre === "korean" || a.genre === "traditional" || a.genre === "korean_dance";
      }
      
      return field === fieldFilter || a.genre === fieldFilter;
    });
  }

  // 3. Search Query logic
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.name_en?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.bio?.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q) ||
        a.role?.toLowerCase().includes(q) ||
        a.works?.some((w: any) => {
          const title = typeof w === "string" ? w : w?.title || "";
          return title.toLowerCase().includes(q);
        }) ||
        a.tags?.some((t) => t.toLowerCase().includes(q)) ||
        a.representative_work?.toLowerCase().includes(q)
    );
  }

  return results;
}

export const fieldLabels: Record<string, string> = {
  all: "전체 분야",
  dance: "무용",
  music: "음악",
  visual: "시각 예술",
};

export const typeLabels: Record<string, string> = {
  all: "전체",
  individual: "개인",
  group: "그룹/단체",
};
