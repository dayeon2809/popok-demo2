import { Performance } from "@/types";
import performancesData from "../data/performances.json";

export const performances: Performance[] = performancesData as Performance[];

export function getPerformances(): Performance[] {
  // Filter out non-published performances
  const published = performances.filter(p => !p.status || p.status === "published");
  
  // Current date in YYYY-MM-DD format (local timezone)
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
  const todayStr = localISOTime;
  
  const upcoming: Performance[] = [];
  const past: Performance[] = [];
  
  published.forEach(p => {
    // If no endDate, fallback to startDate
    const end = p.endDate || p.startDate || "";
    if (end >= todayStr) {
      upcoming.push(p);
    } else {
      past.push(p);
    }
  });
  
  // Sort upcoming: starting soonest first (startDate ASC)
  upcoming.sort((a, b) => {
    const dateA = a.startDate || "";
    const dateB = b.startDate || "";
    return dateA.localeCompare(dateB);
  });
  
  // Sort past: recently ended first (endDate DESC, fallback to startDate DESC)
  past.sort((a, b) => {
    const endA = a.endDate || a.startDate || "";
    const endB = b.endDate || b.startDate || "";
    return endB.localeCompare(endA);
  });
  
  return [...upcoming, ...past];
}

export function getPerformance(id: string): Performance | undefined {
  if (!id) return undefined;
  const decoded = decodeURIComponent(id).trim().toLowerCase();
  return performances.find(p => p.id.trim().toLowerCase() === decoded);
}

/**
 * URL에 포함된 한글, 공백, 괄호 등 특수문자를 인코딩하여 브라우저에서 안전하게 로드할 수 있도록 처리합니다.
 * 이미 인코딩된 URL(예: %28, %29, %20 등)을 중복 인코딩하지 않도록 decodeURI를 선제 적용합니다.
 */
export function formatImageUrl(urlStr: string): string {
  if (!urlStr) return "";
  try {
    const trimmed = urlStr.trim();
    let decoded = trimmed;
    try {
      // %28 -> (, %29 -> ) 등으로 먼저 디코딩하여 중복 인코딩 방지
      decoded = decoded.replace(/%28/gi, "(").replace(/%29/gi, ")");
      decoded = decodeURI(decoded);
    } catch (e) {
      // 디코딩 에러 발생 시, %28/%29 디코딩이 완료된 값으로 대체 사용
      decoded = trimmed.replace(/%28/gi, "(").replace(/%29/gi, ")");
    }
    
    // 전체를 안전하게 encodeURI 처리
    let encoded = encodeURI(decoded);
    
    // encodeURI가 변환하지 않는 괄호 '(', ')'를 수동으로 변환 (%28, %29)
    encoded = encoded.replace(/\(/g, "%28").replace(/\)/g, "%29");
    
    return encoded;
  } catch (e) {
    return urlStr;
  }
}

/**
 * 공연 정보에서 우선순위에 따라 포스터 이미지 URL을 결정합니다.
 * 1. imageUrl 필드 값이 있으면 해당 URL을 포스터 이미지로 사용
 * 2. posterImage 필드 값이 있으면 fallback으로 사용
 * 3. 둘 다 없으면 undefined를 반환 (컴포넌트에서 기본 placeholder 렌더링)
 */
export function getPerformancePosterUrl(p: Performance): string | undefined {
  if (p.imageUrl && p.imageUrl.trim() !== "") {
    return formatImageUrl(p.imageUrl);
  }
  if (p.posterImage && p.posterImage.trim() !== "") {
    return formatImageUrl(p.posterImage);
  }
  return undefined;
}
