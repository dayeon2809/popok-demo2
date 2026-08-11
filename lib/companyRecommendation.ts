import type { Company } from "@/types";

export const COMPANY_RECOMMENDATION_QUESTIONS = [
  { id: "field", title: "어떤 분야의 단체를 찾고 있나요?", options: [
    { id: "contemporary", label: "현대무용", terms: ["현대무용", "현대 무용", "contemporary"] },
    { id: "ballet", label: "발레", terms: ["발레", "ballet"] },
    { id: "korean-dance", label: "한국무용", terms: ["한국무용", "한국 무용", "한국춤", "korean dance"] },
    { id: "interdisciplinary", label: "다원예술", terms: ["다원", "융복합", "interdisciplinary", "multidisciplinary"] },
    { id: "music", label: "음악", terms: ["음악", "music", "sound"] },
    { id: "visual", label: "시각예술", terms: ["시각예술", "visual art", "미디어아트", "media art", "설치"] },
  ]},
  { id: "mood", title: "어떤 작업 성향에 끌리나요?", options: [
    { id: "sensory", label: "감각적인", terms: ["감각", "감성", "몰입"] },
    { id: "philosophical", label: "철학적인", terms: ["철학", "사유", "개념", "탐구"] },
    { id: "experimental", label: "실험적인", terms: ["실험", "도전", "해체", "전복", "새로운 형식"] },
    { id: "delicate", label: "조용하고 섬세한", terms: ["조용", "섬세", "고요", "느린", "미세"] },
    { id: "energetic", label: "강렬한 에너지", terms: ["강렬", "에너지", "역동", "폭발"] },
    { id: "social", label: "사회적 메시지", terms: ["사회", "메시지", "비판", "정치", "시대", "연대"] },
    { id: "visual-beauty", label: "시각적으로 아름다운", terms: ["시각", "아름다움", "비주얼", "오브제", "미장센"] },
  ]},
  { id: "format", title: "관심 있는 형식은 무엇인가요?", options: [
    { id: "format-contemporary", label: "Contemporary Dance", terms: ["현대무용", "현대 무용", "contemporary"] },
    { id: "format-ballet", label: "Ballet", terms: ["발레", "ballet"] },
    { id: "format-korean", label: "Korean Dance", terms: ["한국무용", "한국 무용", "한국춤", "korean dance"] },
    { id: "format-theatre", label: "Theatre", terms: ["연극", "극장", "theatre", "시어터"] },
    { id: "format-music", label: "Music", terms: ["음악", "music", "sound"] },
    { id: "format-media", label: "Media Art", terms: ["미디어아트", "미디어 아트", "media art"] },
    { id: "format-interdisciplinary", label: "Interdisciplinary", terms: ["다원", "융복합", "interdisciplinary"] },
    { id: "format-technology", label: "AI / Technology", terms: ["기술", "테크놀로지", "technology", "인공지능", "ai"] },
    { id: "format-installation", label: "Installation", terms: ["설치", "installation"] },
  ]},
  { id: "keyword", title: "지금 관심 있는 키워드는 무엇인가요?", options: [
    { id: "keyword-body", label: "#몸", terms: ["몸", "신체"] },
    { id: "keyword-relationship", label: "#관계", terms: ["관계", "연결"] },
    { id: "keyword-community", label: "#공동체", terms: ["공동체", "커뮤니티", "연대"] },
    { id: "keyword-memory", label: "#기억", terms: ["기억", "회상", "역사"] },
    { id: "keyword-breath", label: "#호흡", terms: ["호흡", "숨"] },
    { id: "keyword-space", label: "#공간", terms: ["공간", "장소"] },
    { id: "keyword-women", label: "#여성", terms: ["여성", "젠더", "woman", "women"] },
    { id: "keyword-city", label: "#도시", terms: ["도시", "도시성", "urban"] },
    { id: "keyword-nature", label: "#자연", terms: ["자연", "생태", "환경"] },
    { id: "keyword-emotion", label: "#감정", terms: ["감정", "정서", "마음"] },
    { id: "keyword-labor", label: "#노동", terms: ["노동", "근로"] },
    { id: "keyword-technology", label: "#기술", terms: ["기술", "테크놀로지", "technology", "디지털"] },
    { id: "keyword-audience", label: "#관객참여", terms: ["관객 참여", "관객참여", "참여형", "인터랙티브"] },
  ]},] as const;

type RecommendationOption = (typeof COMPANY_RECOMMENDATION_QUESTIONS)[number]["options"][number];
export interface CompanyRecommendationResult { company: Company; score: number; maxScore: number; percentage: number; reasons: string[]; matchedItems: string[]; }

const DIRECT_WEIGHT = 3;
const PROFILE_WEIGHT = 2;
const ACTIVITY_WEIGHT = 1;
const MAX_SCORE_PER_SELECTION = DIRECT_WEIGHT + PROFILE_WEIGHT + ACTIVITY_WEIGHT;

function valueToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(valueToText).join(" ");
  if (typeof value === "object") return Object.values(value).map(valueToText).join(" ");
  return "";
}
function normalizeText(...values: unknown[]): string { return values.map(valueToText).join(" ").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim(); }
function findMatchedTerm(text: string, option: RecommendationOption): string | null { return option.terms.find((term) => text.includes(term.toLocaleLowerCase("ko-KR"))) || null; }
function getSelectedOptions(ids: string[]): RecommendationOption[] { const selected = new Set(ids); return COMPANY_RECOMMENDATION_QUESTIONS.flatMap((q) => q.options.filter((o) => selected.has(o.id))); }

function getCompanyCompleteness(company: Company): number {
  return [company.profile_image_url, company.bio_short, company.bio, company.mission, company.vision, company.genre, company.category, company.city_or_region, company.works?.length, company.current_activity?.length].filter(Boolean).length;
}
function compareFallbackCompanies(a: Company, b: Company): number {
  if (!!a.verified !== !!b.verified) return a.verified ? -1 : 1;
  const completeness = getCompanyCompleteness(b) - getCompanyCompleteness(a);
  if (completeness) return completeness;
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return dateB - dateA || a.name.localeCompare(b.name, "ko");
}
export function getFallbackCompanies(companies: Company[], limit = 3): Company[] { return [...companies].sort(compareFallbackCompanies).slice(0, limit); }

export function recommendCompanies(companies: Company[], selectedOptionIds: string[], limit = 3): CompanyRecommendationResult[] {
  const selectedOptions = getSelectedOptions(selectedOptionIds);
  const maxScore = selectedOptions.length * MAX_SCORE_PER_SELECTION;
  if (!maxScore) return [];
  return companies.map((company): CompanyRecommendationResult => {
    const directText = normalizeText(company.category, company.genre, company.city_or_region);
    const profileText = normalizeText(company.bio_short, company.bio, company.mission, company.vision, company.core_values);
    const activityText = normalizeText(company.works, company.current_activity, company.review_links);
    let score = 0;
    const reasons: string[] = [];
    const matchedItems: string[] = [];
    selectedOptions.forEach((option) => {
      const directMatch = findMatchedTerm(directText, option);
      const profileMatch = findMatchedTerm(profileText, option);
      const activityMatch = findMatchedTerm(activityText, option);
      // Each option earns each tier at most once: 3 + 2 + 1 = 6 maximum.
      // Repeated terms, synonyms, and multiple fields in one tier add no points.
      if (directMatch) { score += DIRECT_WEIGHT; reasons.push(`${option.label} 장르·분야 일치`); }
      if (profileMatch) { score += PROFILE_WEIGHT; reasons.push(`${option.label} 성향이 단체 소개와 일치`); }
      if (activityMatch) { score += ACTIVITY_WEIGHT; reasons.push(`${option.label} 관련 작업·활동 확인`); }
      if (directMatch || profileMatch || activityMatch) {
        const terms = [directMatch, profileMatch, activityMatch].filter(Boolean) as string[];
        matchedItems.push(`${option.label} · ${Array.from(new Set(terms)).join("/")}`);
      }
    });
    // Suitability = earned score / (selected option count × 6) × 100.
    const percentage = Math.min(100, Math.round((score / maxScore) * 100));
    const uniqueReasons = Array.from(new Set(reasons));
    if (score > 0 && uniqueReasons.length < 2) uniqueReasons.push("선택한 조건이 실제 단체 정보에서 확인됨");
    return { company, score, maxScore, percentage, reasons: uniqueReasons.slice(0, 3), matchedItems: Array.from(new Set(matchedItems)).slice(0, 3) };
  }).filter((result) => result.score > 0).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dateA = a.company.createdAt ? new Date(a.company.createdAt).getTime() : 0;
    const dateB = b.company.createdAt ? new Date(b.company.createdAt).getTime() : 0;
    return dateB - dateA || a.company.name.localeCompare(b.company.name, "ko");
  }).slice(0, limit);
}
