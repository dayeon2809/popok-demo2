"use client";

import { useState } from "react";
import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  company: string;
  bio: string;
  works: string[];
  field: string;
  genre: string;
  instagram: string;
  website: string;
  profileImage: string;
  status: string;
  aiSummary: string;
  tags: string[];
  reviews: { workTitle: string; source: string; url: string }[];
  createdAt: string;
}

// ── 설문 문항 정의 ─────────────────────────────────────────────────
const Q1_OPTIONS = [
  "공연을 보고 싶어서",
  "새로운 안무가를 알고 싶어서",
  "무용을 처음 접해봐서",
  "연구/리서치 목적으로",
  "창작 영감을 얻고 싶어서"
];

const Q2_OPTIONS = [
  "감각적인",
  "철학적인",
  "감동적인",
  "실험적인",
  "조용하고 섬세한",
  "강렬한 에너지",
  "사회적 메시지가 있는",
  "시각적으로 아름다운"
];

const Q3_OPTIONS = [
  "contemporary dance",
  "ballet",
  "korean dance",
  "theatre",
  "music",
  "media art",
  "interdisciplinary",
  "AI / technology",
  "installation"
];

const Q4_OPTIONS = [
  "몸",
  "관계",
  "공동체",
  "기억",
  "호흡",
  "공간",
  "여성",
  "도시",
  "자연",
  "감정",
  "노동",
  "기술",
  "관객참여"
];

// 키워드 줄기(Stemming) 추출 함수
function getMatchTerms(term: string): string[] {
  const k = term.trim().toLowerCase();
  if (k === "contemporary dance") return ["contemporary", "현대무용", "현대 무용"];
  if (k === "ballet") return ["ballet", "발레"];
  if (k === "korean dance") return ["korean", "한국무용", "한국 춤", "한국춤"];
  if (k === "interdisciplinary") return ["다원", "interdisciplinary"];
  if (k === "media art") return ["미디어", "media art"];
  if (k === "ai / technology") return ["기술", "ai", "technology", "테크놀로지"];
  if (k === "installation") return ["설치", "installation"];
  if (k === "theatre") return ["연극", "theatre", "시어터"];
  if (k === "music") return ["음악", "music"];

  if (k === "감각적인") return ["감각", "감성"];
  if (k === "철학적인") return ["철학", "사유", "개념"];
  if (k === "감동적인") return ["감동", "위로", "울림", "행복"];
  if (k === "실험적인") return ["실험", "도전", "해체", "전복"];
  if (k === "조용하고 섬세한") return ["조용", "섬세", "고요", "느린"];
  if (k === "강렬한 에너지") return ["강렬", "에너지", "폭발", "역동"];
  if (k === "사회적 메시지가 있는") return ["사회", "메시지", "비판", "시대", "정치"];
  if (k === "시각적으로 아름다운") return ["시각", "아름다운", "아름다움", "비주얼", "오브제"];

  return [k];
}

interface RecommendationResult {
  artist: Artist;
  score: number;
  matchedKeywords: string[];
}

interface RecommendClientProps {
  initialArtists: Artist[];
}

export default function RecommendClient({ initialArtists }: RecommendClientProps) {
  // 설문 상태 관리
  const [selectedQ1, setSelectedQ1] = useState<string[]>([]);
  const [selectedQ2, setSelectedQ2] = useState<string[]>([]);
  const [selectedQ3, setSelectedQ3] = useState<string[]>([]);
  const [selectedQ4, setSelectedQ4] = useState<string[]>([]);

  const [results, setResults] = useState<RecommendationResult[] | null>(null);

  const toggleOption = (option: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (state.includes(option)) {
      setState(state.filter(o => o !== option));
    } else {
      setState([...state, option]);
    }
  };

  // 추천 실행 로직
  const handleRecommend = () => {
    const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
    const published = initialArtists.filter(
      (a) => showDraft || !a.status || a.status === "published"
    );

    // 사용자가 선택한 모든 답변 키워드 모음 (형식 + 분위기 + 키워드)
    const userAnswers = [...selectedQ2, ...selectedQ3, ...selectedQ4];

    const scored: RecommendationResult[] = published.map((artist) => {
      let score = 0;
      const matchedKeywords: string[] = [];

      const name = artist.name || "";
      const company = artist.company || "";
      const bio = artist.bio || "";
      const field = artist.field || "";
      const genre = artist.genre || "";
      const aiSummary = artist.aiSummary || "";
      const tags = artist.tags || [];
      const works = artist.works || [];
      const reviews = artist.reviews || [];
      const worksStringList = works.map((w: any) => typeof w === "string" ? w : w.title || "");

      // 매칭에 사용할 아티스트의 정보 텍스트 집합
      const bioText = `${bio} ${aiSummary}`.toLowerCase();
      const worksText = [
        ...worksStringList,
        ...reviews.map(r => `${r.workTitle} ${r.source}`)
      ].join(" ").toLowerCase();
      const metaText = `${name} ${company} ${field} ${genre} ${tags.join(" ")}`.toLowerCase();

      // Q3 (관심 형식): 일치 시 가중치 +3점
      selectedQ3.forEach((q3Opt) => {
        const terms = getMatchTerms(q3Opt);
        const isMatch = terms.some(term => 
          genre.toLowerCase().includes(term) || 
          field.toLowerCase().includes(term) || 
          metaText.includes(term)
        );

        if (isMatch) {
          score += 3;
          if (!matchedKeywords.includes(q3Opt)) {
            matchedKeywords.push(q3Opt);
          }
        }
      });

      // Q2 (분위기) 및 Q4 (키워드) 매칭
      const atmosphereAndKeywords = [...selectedQ2, ...selectedQ4];

      atmosphereAndKeywords.forEach((term) => {
        const matchTerms = getMatchTerms(term);
        
        // 1) Bio 및 AI Summary에 포함 시: +2점
        const bioMatch = matchTerms.some(t => bioText.includes(t));
        if (bioMatch) {
          score += 2;
          if (!matchedKeywords.includes(term)) {
            matchedKeywords.push(term);
          }
        }

        // 2) 대표작 또는 리뷰 목록에 포함 시: +1점
        const worksMatch = matchTerms.some(t => worksText.includes(t));
        if (worksMatch) {
          score += 1;
          if (!matchedKeywords.includes(term)) {
            matchedKeywords.push(term);
          }
        }
      });

      return {
        artist,
        score,
        matchedKeywords
      };
    });

    // 점수 내림차순 정렬
    // 아무것도 선택하지 않거나 매칭 점수가 0인 경우, 등록 시점(createdAt) 최신순 또는 랜덤으로 추천
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 동일 점수 시 등록 순(createdAt) 역순 정렬
      const dateA = a.artist.createdAt ? new Date(a.artist.createdAt).getTime() : 0;
      const dateB = b.artist.createdAt ? new Date(b.artist.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // 상위 3 ~ 5개 추출
    const topResults = scored.slice(0, 5);
    setResults(topResults);
  };

  const handleReset = () => {
    setSelectedQ1([]);
    setSelectedQ2([]);
    setSelectedQ3([]);
    setSelectedQ4([]);
    setResults(null);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      {/* ── 제목 및 설명 ── */}
      <div style={{ textAlign: "center", marginBottom: "44px" }}>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--navy)", fontWeight: 800 }}>
          나에게 맞는 공연 찾기
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", marginTop: "10px", lineHeight: "1.6" }}>
          몇 가지 질문에 답하면 POPOK이 당신의 취향에 가까운 안무가와 작품을 추천합니다.
        </p>
      </div>

      {results === null ? (
        // ── 설문 폼 화면 ─────────────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          
          {/* Q1 */}
          <div style={questionBlockStyle}>
            <h3 style={questionTitleStyle}>
              Q1. 오늘 어떤 이유로 방문했나요? <span style={{ color: "var(--ink-faint)", fontWeight: "normal", fontSize: "0.8rem" }}>(복수 선택 가능)</span>
            </h3>
            <div style={gridStyle}>
              {Q1_OPTIONS.map((opt) => {
                const isSel = selectedQ1.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt, selectedQ1, setSelectedQ1)}
                    style={isSel ? selectedActiveCardStyle : cardStyle}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div style={questionBlockStyle}>
            <h3 style={questionTitleStyle}>
              Q2. 어떤 분위기의 작품을 찾고 있나요? <span style={{ color: "var(--ink-faint)", fontWeight: "normal", fontSize: "0.8rem" }}>(복수 선택 가능)</span>
            </h3>
            <div style={gridStyle}>
              {Q2_OPTIONS.map((opt) => {
                const isSel = selectedQ2.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt, selectedQ2, setSelectedQ2)}
                    style={isSel ? selectedActiveCardStyle : cardStyle}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q3 */}
          <div style={questionBlockStyle}>
            <h3 style={questionTitleStyle}>
              Q3. 관심 있는 형식은 무엇인가요? <span style={{ color: "var(--ink-faint)", fontWeight: "normal", fontSize: "0.8rem" }}>(복수 선택 가능)</span>
            </h3>
            <div style={gridStyle}>
              {Q3_OPTIONS.map((opt) => {
                const isSel = selectedQ3.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt, selectedQ3, setSelectedQ3)}
                    style={isSel ? selectedActiveCardStyle : cardStyle}
                  >
                    <span className="mono" style={{ textTransform: "capitalize" }}>{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Q4 */}
          <div style={questionBlockStyle}>
            <h3 style={questionTitleStyle}>
              Q4. 지금 보고 싶은 키워드는 무엇인가요? <span style={{ color: "var(--ink-faint)", fontWeight: "normal", fontSize: "0.8rem" }}>(복수 선택 가능)</span>
            </h3>
            <div style={gridStyle}>
              {Q4_OPTIONS.map((opt) => {
                const isSel = selectedQ4.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt, selectedQ4, setSelectedQ4)}
                    style={isSel ? selectedActiveCardStyle : cardStyle}
                  >
                    #{opt}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleRecommend}
            style={{
              padding: "16px",
              background: "var(--navy)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: "20px",
              boxShadow: "0 4px 12px rgba(30, 45, 64, 0.15)"
            }}
          >
            추천 보기
          </button>
        </div>
      ) : (
        // ── 추천 결과 화면 ───────────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)" }}>🎭 추천 결과</h2>
            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1.5px solid var(--border)",
                borderRadius: "8px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                color: "var(--ink-muted)"
              }}
            >
              다시 선택하기
            </button>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: "12px", background: "#fff" }}>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem", marginBottom: "20px" }}>
                아직 충분한 추천 데이터가 없습니다. Artist DB에서 직접 탐색해보세요.
              </p>
              <Link href="/artists" style={{
                textDecoration: "none", padding: "12px 24px", background: "var(--navy)", color: "#fff",
                borderRadius: "8px", fontSize: "0.88rem", fontWeight: 700, display: "inline-block"
              }}>
                Artist DB 이동하기
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {results.map(({ artist, score, matchedKeywords }) => {
                const worksToShow = (artist.works || [])
                  .slice(0, 3)
                  .map((w: any) => typeof w === "string" ? w : w.title || "");
                
                // 추천 이유 문구 빌드
                let reason = "POPOK이 추천하는 아티스트입니다.";
                if (matchedKeywords.length > 0) {
                  const itemsText = matchedKeywords.map(k => `‘${k}’`).join(", ");
                  reason = `선택한 키워드 ${itemsText}과 이 아티스트의 작업 설명이 잘 맞습니다.`;
                }

                // AI summary 요약 (두 줄)
                let aiSummaryTruncated = artist.aiSummary || "";
                if (aiSummaryTruncated.length > 120) {
                  aiSummaryTruncated = aiSummaryTruncated.substring(0, 115) + "...";
                }

                return (
                  <div key={artist.id} style={resultCardStyle}>
                    
                    {/* 아티스트 이미지 */}
                    <div style={{
                      width: "100%", height: "180px", background: "#f0f2f5",
                      backgroundImage: artist.profileImage ? `url(${artist.profileImage})` : "none",
                      backgroundSize: "cover", backgroundPosition: "center",
                      borderRadius: "8px", overflow: "hidden", display: "flex",
                      alignItems: "center", justifyContent: "center", position: "relative"
                    }}>
                      {!artist.profileImage && (
                        <span style={{ fontSize: "2.4rem" }}>🎭</span>
                      )}
                      
                      {score > 0 && (
                        <div style={{
                          position: "absolute", top: "12px", right: "12px",
                          background: "var(--accent)", color: "var(--navy)",
                          padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem",
                          fontWeight: 800, border: "1px solid var(--navy)"
                        }}>
                          매칭도 {score}pt
                        </div>
                      )}
                    </div>

                    {/* 아티스트 상세 정보 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
                            {artist.name}
                          </h3>
                          {artist.company && (
                            <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>
                              {artist.company}
                            </span>
                          )}
                        </div>
                        
                        {/* Genre / Tag */}
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                          <span style={tagStyle}>{artist.field === "dance" ? "무용" : "기타"}</span>
                          {artist.genre && <span style={tagStyle}>{artist.genre}</span>}
                          {(artist.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} style={tagStyle}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      {/* AI Summary 2줄 미리보기 */}
                      {artist.aiSummary ? (
                        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: "1.5", margin: 0 }}>
                          {aiSummaryTruncated}
                        </p>
                      ) : (
                        <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)", fontStyle: "italic", margin: 0 }}>
                          아티스트 소개 및 주요 이력 준비 중입니다.
                        </p>
                      )}

                      {/* 대표작 2~3개 */}
                      {worksToShow.length > 0 && (
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                          <strong>주요 대표작:</strong> {worksToShow.join(", ")}
                        </div>
                      )}

                      {/* 추천 이유 */}
                      <div style={{
                        background: "var(--accent-light)",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #FEF3C7",
                        fontSize: "0.82rem",
                        color: "#92400E",
                        fontWeight: 600,
                        lineHeight: "1.4"
                      }}>
                        💡 {reason}
                      </div>

                      <Link href={`/artists/${artist.id}`} style={{
                        textDecoration: "none", background: "var(--navy)", color: "#fff",
                        padding: "12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700,
                        textAlign: "center", display: "block", marginTop: "4px"
                      }}>
                        상세 정보 보기
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Styles
const questionBlockStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--border)",
  borderRadius: "14px",
  padding: "24px 28px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
};
const questionTitleStyle: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 800,
  color: "var(--navy)",
  marginBottom: "18px",
  margin: 0
};
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px"
};
const cardStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "#fdfdfd",
  border: "1.5px solid var(--border)",
  borderRadius: "10px",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--ink-muted)",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.18s ease",
  userSelect: "none"
};
const selectedActiveCardStyle: React.CSSProperties = {
  ...cardStyle,
  background: "var(--accent-light)",
  borderColor: "var(--accent)",
  color: "var(--accent-dark)",
  fontWeight: 700,
  boxShadow: "0 2px 8px rgba(245, 166, 35, 0.1)"
};
const resultCardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--border)",
  borderRadius: "14px",
  padding: "24px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
};
const tagStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  background: "#f1f3f5",
  color: "var(--ink-muted)",
  padding: "3px 8px",
  borderRadius: "12px"
};
