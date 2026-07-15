"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/useLanguage";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";

const ABOUT_COPY = {
  ko: {
    heroTitle: "만들고. 공유하고. 연결되고. 확장하세요.",
    heroDesc: "POPOK은 모든 장르의 아티스트와 크리에이터가 자신의 예술을 선명하게 기록하고 세상에 드러낼 수 있는 공간입니다.",
    howTitle: "만들고 공유하는 방법",
    steps: [
      {
        meta: "01 CREATE",
        title: "나만의 명함 시작",
        body: "프로필, 대표 작업, 경력과 링크를 선명하게 모아 당신만의 POPOK 카드를 완성합니다."
      },
      {
        meta: "02 SHARE",
        title: "어디서나 간편하게",
        body: "개인 맞춤 QR 코드 또는 하나의 공유 URL로 당신의 포트폴리오를 빠르게 전달합니다."
      },
      {
        meta: "03 CONNECT",
        title: "작업 기회와 연결",
        body: "작품과 아티스트를 찾는 기획자, 연출가, 브랜드와 만나 새로운 협업의 가능성을 만듭니다."
      },
      {
        meta: "04 GROW",
        title: "발견을 이어가기",
        body: "당신의 프로필이 어떻게 발견되는지 확인하고, 작업의 흐름을 계속 업데이트하세요."
      }
    ]
  },
  en: {
    heroTitle: "Create. Share. Connect. Grow.",
    heroDesc: "POPOK is a unified digital canvas and portfolio where artists from all genres record, present, and showcase their artistic journey to the world.",
    howTitle: "How to Build and Share",
    steps: [
      {
        meta: "01 CREATE",
        title: "Start your own card",
        body: "Gather your profile, projects, experiences, and links into a clean POPOK card."
      },
      {
        meta: "02 SHARE",
        title: "Easy anywhere",
        body: "Share your portfolio through a personalized QR card or one simple URL."
      },
      {
        meta: "03 CONNECT",
        title: "Connect with opportunities",
        body: "Meet producers, directors, brands, and collaborators looking for artists and works."
      },
      {
        meta: "04 GROW",
        title: "Grow your presence",
        body: "Track how your profile is discovered and keep your work updated."
      }
    ]
  }
};

export default function AboutClient() {
  const { language } = useLanguage();
  const t = ABOUT_COPY[language];

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh", overflowX: "hidden" }}>
      
      {/* ── 1. ABOUT HERO ── */}
      <section style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 32px 60px",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "6px 14px",
          marginBottom: "24px",
        }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-dark)", display: "inline-block" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "0.08em" }}>
            ABOUT POPOK
          </span>
        </div>
        <h1 className="display" style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.04em",
          lineHeight: 1.15,
          marginBottom: "24px",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          {t.heroTitle}
        </h1>
        <p style={{
          fontSize: "1.1rem",
          color: "var(--ink-muted)",
          lineHeight: 1.6,
          maxWidth: "640px",
          margin: "0 auto 40px"
        }}>
          {t.heroDesc}
        </p>
      </section>

      {/* ── 2. HOW POPOK WORKS ── */}
      <section id="how-it-works" style={{
        borderTop: "1px solid var(--border)",
        background: "#FFFFFF",
        padding: "80px 32px",
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              HOW POPOK WORKS
            </span>
            <h2 className="display" style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              color: "var(--navy)",
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}>
              {t.howTitle}
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px"
          }}>
            {t.steps.map((step, idx) => (
              <div key={idx} style={{
                border: "1.5px solid var(--border)",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                background: "var(--bg-warm)",
                justifyContent: "space-between",
                height: "240px"
              }}>
                <div>
                  <span className="mono" style={{ fontSize: "0.8rem", color: "var(--accent-dark)", fontWeight: 900, display: "block", marginBottom: "12px" }}>
                    {step.meta}
                  </span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", marginBottom: "8px" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. ROADMAP SECTION ── */}
      <section style={{
        padding: "80px 32px",
        maxWidth: "1120px",
        margin: "0 auto",
      }}>
        <div style={{ marginBottom: "48px" }}>
          <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
            OUR JOURNEY & FUTURE
          </span>
          <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.03em", margin: 0 }}>
            POPOK 로드맵
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }} className="roadmap-grid">
          <div style={roadmapCardStyle}>
            <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "#047857", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "12px" }}>
              1단계: 완료
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 8px" }}>디지털 명함 & 포트폴리오</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>
              프로필 정보, 유튜브 임베드, 작업 링크 및 대표 작품(Works)을 하나의 깔끔한 디지털 명함 페이지로 모아 즉시 공유할 수 있는 핵심 기능을 출시했습니다. 개인 아티스트는 직접 등록하며, 단체는 POPOK 운영팀이 인터뷰를 통해 함께 구축합니다.
            </p>
          </div>

          <div style={roadmapCardStyle}>
            <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "12px" }}>
              2단계: 진행 중
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 8px" }}>AI 자동 정보 갱신 & 분석</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>
              가입 양식이나 브로셔 등 텍스트 업로드 시 AI가 자동으로 학력, 연출작, 수상 이력을 추출하여 프로필을 자동 구성해주는 스마트 갱신 로직을 도입하고 있습니다.
            </p>
          </div>

          <div style={roadmapCardStyle}>
            <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "#C2410C", background: "#FFF7ED", border: "1px solid #FED7AA", padding: "4px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "12px" }}>
              3단계: 예정
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 8px" }}>공연 기획 & 매칭 플랫폼</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>
              기획자 및 연출진이 원하는 장르와 스타일의 무용수/안무가를 찾고, Piece of Cake 데이터베이스의 공연 타임라인과 즉각 연동하여 캐스팅 기회를 주선합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. PREMIUM SPECIFICATION ── */}
      <section style={{
        background: "var(--navy)",
        color: "#FFFFFF",
        padding: "80px 32px"
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "48px", alignItems: "center" }} className="premium-split">
          <div>
            <span className="mono" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              POPOK PREMIUM
            </span>
            <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#FFFFFF", fontWeight: 950, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              프리미엄 혜택
            </h2>
            <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: "28px" }}>
              POPOK Premium은 아티스트로서의 독보적인 온오프라인 브랜딩을 강화할 수 있도록 더 깊은 관리 옵션을 제공합니다.
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", padding: 0, margin: 0, listStyle: "none" }}>
              <li style={{ display: "flex", gap: "10px", fontSize: "0.88rem", fontWeight: 700 }}>
                <span>✓</span> <span>대표 작품 수 제한 없는 무제한(Unlimited) 등록</span>
              </li>
              <li style={{ display: "flex", gap: "10px", fontSize: "0.88rem", fontWeight: 700 }}>
                <span>✓</span> <span>AI 자동 포트폴리오 업데이트 파서(Parser) 지원</span>
              </li>
              <li style={{ display: "flex", gap: "10px", fontSize: "0.88rem", fontWeight: 700 }}>
                <span>✓</span> <span>POPOK 메인 슬라이더 및 추천 탐색 페이지 최상위 Featured 노출</span>
              </li>
            </ul>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.06)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
            padding: "32px",
            textAlign: "center"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 10px", color: "var(--accent)" }}>멤버십 출시 예정</h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginBottom: "20px" }}>
              현재 테스트 기간에는 모든 사용자에게 프리미엄 신청 검수 및 무료 테스트를 지원하고 있습니다.
            </p>
            <Link href="/auth" style={{
              display: "block", textDecoration: "none", background: "var(--accent)", color: "var(--navy)",
              fontWeight: 900, fontSize: "0.9rem", padding: "12px", borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(200, 238, 82, 0.25)"
            }}>
              지금 내 포퐄 만들기 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. TEAM INTRODUCTION ── */}
      <section style={{
        padding: "80px 32px",
        maxWidth: "1120px",
        margin: "0 auto",
      }}>
        <div style={{ marginBottom: "48px" }}>
          <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
            THE CREATORS
          </span>
          <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.03em", margin: 0 }}>
            포퐄 팀 소개
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="roadmap-grid">
          <div style={{ background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 4px" }}>이다연 (Founder / Dancer)</h3>
            <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "var(--accent-dark)" }}>기획 및 예술총괄</span>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5, marginTop: "12px", marginBottom: 0 }}>
              예술가이자 연출진으로서 겪었던 복잡하고 파편화된 프로필 관리의 한계를 해결하기 위해 포퐄을 설립했습니다. 아티스트와 기획자가 가장 단순하게 만날 수 있는 길을 기획합니다.
            </p>
          </div>
          <div style={{ background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 4px" }}>Antigravity (Core Tech Engine)</h3>
            <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "var(--accent-dark)" }}>인공지능 코딩 엔진</span>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5, marginTop: "12px", marginBottom: 0 }}>
              포퐄의 기반 시스템 개발과 최신화 파서, 다국어 모바일 최적화 웹엔진 구축을 담당하고 있습니다. 아티스트의 정보 관리 스트레스를 0으로 만드는 고도화 솔루션을 구축합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── 7. FAQ ── */}
      <FAQSection />

      <style>{`
        @media (max-width: 768px) {
          .roadmap-grid {
            grid-template-columns: 1fr !important;
          }
          .premium-split {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}

const roadmapCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1.5px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};
