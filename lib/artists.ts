import { ArtistWithWorks } from "@/types";
import artistsData from "../data/artists.json";

// recordId가 없는 로컬 데이터에 id를 recordId로 복사해서 매핑해 줍니다.
export const artists: ArtistWithWorks[] = (artistsData as any[]).map((a) => ({
  ...a,
  recordId: a.recordId || a.id,
})) as ArtistWithWorks[];

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
    
    // 3) ID에 이름이 포함되어 있는 경우 (예: 이해니-eerbmblv에서 '이해니' 또는 '이해니-eerbmblv'로 조회)
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

  if (typeFilter && typeFilter !== "all") {
    results = results.filter((a) => {
      const type = a.type || (a.company ? "company" : "individual");
      return type === typeFilter;
    });
  }

  if (fieldFilter && fieldFilter !== "all") {
    results = results.filter((a) => {
      // Map old filters (like contemporary_dance) to the new field/genre structure
      if (fieldFilter === "contemporary_dance") {
        return a.field === "dance" && a.genre === "contemporary";
      }
      if (fieldFilter === "korean_dance") {
        return a.field === "dance" && a.genre === "korean";
      }
      if (fieldFilter === "ballet") {
        return a.field === "dance" && a.genre === "ballet";
      }
      if (fieldFilter === "interdisciplinary") {
        return a.field === "interdisciplinary";
      }
      return a.field === fieldFilter || a.genre === fieldFilter;
    });
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.name_en?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.bio?.toLowerCase().includes(q) ||
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
  contemporary_dance: "현대무용",
  ballet: "발레",
  korean_dance: "한국무용",
  interdisciplinary: "다원예술",
  unknown: "기타",
};

export const typeLabels: Record<string, string> = {
  all: "전체",
  individual: "개인 안무가",
  company: "무용단·단체",
  project_group: "프로젝트팀",
};
