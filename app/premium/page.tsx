"use client";

import { useState } from "react";
import Link from "next/link";
import PremiumPlanCard, { type BillingCycle } from "@/components/PremiumPlanCard";
import { analytics } from "@/lib/analytics";
import { PREMIUM_PLANS as PLANS, type PlanId } from "@/lib/premiumPlans";

const VALUE_ITEMS = [
  {
    title: "활동을 꾸준히 관리합니다",
    body: "새로운 활동이 생겨도 매번 신경 쓸 필요 없습니다. AI와 POPOK 팀이 함께 활동을 모니터링하여 아티스트의 포트폴리오를 항시 최신 상태로 유지합니다.",
  },
  {
    title: "더 많은 사람에게 소개합니다",
    body: "아티스트의 중요한 연출작이나 새로운 활동 소식을 POPOK 플랫폼 메인 영역과 공식 SNS 채널을 활용해 대중과 기획자에게 적극적으로 소개합니다.",
  },
  {
    title: "홍보 콘텐츠 제작을 지원합니다",
    body: "공연이나 전시가 더 많은 관객과 만날 수 있도록 카드뉴스 제작, 숏폼 기획 등 마케팅과 디지털 홍보에 필요한 미디어 콘텐츠 기획·제작을 대행합니다.",
  },
];

const FAQ_ITEMS = [
  {
    question: "오픈 이벤트 가격은 언제까지 적용되나요?",
    answer: "지금 사전 신청하시면 Student는 월 3,900원 혜택을 평생 유지해 드리고, POPOK Artist 프로그램은 얼리버드 한정 혜택으로 월 6,900원에 참여하실 수 있습니다. 이벤트 종료 후에는 각각 정가로 전환될 예정입니다.",
  },
  {
    question: "포트폴리오 업데이트는 어떻게 이루어지나요?",
    answer: "기본적으로 AI 엔진과 운영팀이 아티스트의 새로운 공연 및 전시 활동을 웹상에서 모니터링하여 자동으로 감지하고 반영합니다. 만약 빠르게 반영하고 싶은 공연이나 수동으로 넣고 싶은 고화질 사진/영상 자료가 있다면 이메일이나 카카오톡 채널로 편하게 보내주셔도 즉시 업데이트됩니다.",
  },
  {
    question: "인스타그램을 꼭 공개해야 하나요?",
    answer: "필수가 아닙니다. 다만 주로 활동 소식을 업로드하는 공개용 소셜 계정을 연동해 주시면, 저희 AI 엔진과 매니저가 새로운 활동 정보를 실시간으로 감지하고 검증하는 데 매우 유용합니다.",
  },
  {
    question: "어떤 자료를 공유하면 되나요?",
    answer: "공연명, 전시명, 작품 리플렛, 프로필/공연 고화질 사진, 유튜브 영상 링크, 참여 역할 및 크레딧 등을 공유해 주시면 됩니다. 자료의 일부만 있거나 정제되지 않은 텍스트 상태여도 괜찮습니다.",
  },
  {
    question: "프로그램 참여를 중단하면 기존 프로필은 어떻게 되나요?",
    answer: "기존에 기록해 두신 포트폴리오는 삭제되지 않고 안전하게 유지됩니다. 다만, 참여 중단 시점 이후부터는 정기 모니터링 및 자동 정보 반영, 홍보용 콘텐츠 제작 대행 및 SNS 채널 노출 지원 등의 매니지먼트 혜택이 제한되며 직접 기록을 편집하는 Free 플랜 수준으로 유지됩니다.",
  },
  {
    question: "결제는 언제부터 진행되나요?",
    answer: "현재는 결제 기능이 공개되지 않은 사전 모집(안내 접수) 단계입니다. 지금 신청을 완료하시면 프로그램 정식 시작 및 결제 오픈 시 이메일로 가장 먼저 개별 안내를 드립니다.",
  },
  {
    question: "단체(무용단, 극단, 기획사 등)도 POPOK Artist 프로그램에 신청할 수 있나요?",
    answer: "POPOK Artist 프로그램은 개인 아티스트의 여정을 전담하기 위해 설계되었습니다. 단체나 기획사의 경우 별도의 전용 페이지나 상담 채널을 통해 신청 문의를 남겨 주시면 운영팀이 검토 후 맞춤형 파트너십 구축 및 포트폴리오 구축을 지원해 드립니다.",
  },
];

export default function PremiumPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [openFaqIndexes, setOpenFaqIndexes] = useState<Record<number, boolean>>({});
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3200);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndexes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSubscribe = (planType: PlanId, cycle: BillingCycle) => {
    analytics.premiumClick(`pricing_plan_${planType}`);
    triggerToast("사전 신청이 접수됐어요!\n결제 오픈 시 이메일로 가장 먼저 안내드릴게요.");
  };

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
          background: "var(--navy)", color: "#FFFFFF", padding: "14px 24px", borderRadius: "16px",
          fontSize: "0.85rem", fontWeight: 700, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          textAlign: "center", lineHeight: 1.5, whiteSpace: "pre-line", maxWidth: "90vw"
        }}>
          {toastMsg}
        </div>
      )}

      {/* ── 1. HERO SECTION ── */}
      <section className="premium-section" style={{ maxWidth: "800px", margin: "0 auto", padding: "100px 32px 60px", textAlign: "center" }}>
        <span className="tag" style={{ background: "var(--accent)", color: "var(--navy)", border: "none", marginBottom: "20px", display: "inline-block", fontWeight: 800, letterSpacing: "0.05em" }}>
          POPOK ARTIST PROGRAM
        </span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.03em", marginBottom: "24px", lineHeight: 1.2 }}>
          창작은 당신이.<br />나머지는 POPOK이 함께합니다.
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--ink-muted)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto", fontWeight: 500 }}>
          기록과 홍보의 부담을 내려놓고 창작에만 몰입할 수 있도록,<br />
          AI와 POPOK 팀이 아티스트의 여정을 관리하고 세상에 알립니다.
        </p>
      </section>

      {/* ── 2. PLANS & PRICING ── */}
      <section className="premium-section" style={{ maxWidth: "1120px", margin: "0 auto 100px", padding: "0 32px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex", background: "#FFFFFF", border: "1.5px solid var(--border)",
            borderRadius: "999px", padding: "4px", gap: "4px",
          }}>
            {(["monthly", "annual"] as BillingCycle[]).map((cycle) => {
              const active = billingCycle === cycle;
              const activeBackground = cycle === "annual" ? "var(--accent)" : "var(--navy)";
              const activeColor = cycle === "annual" ? "var(--navy)" : "#FFFFFF";
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  style={{
                    border: "none",
                    borderRadius: "999px",
                    padding: "10px 22px",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    background: active ? activeBackground : "transparent",
                    color: active ? activeColor : "var(--ink-muted)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cycle === "monthly" ? "월간 결제" : "연간 결제 (2개월 무료)"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan) => {
            const isFreePlan = plan.id === "free";
            const ctaLabel = isFreePlan
              ? "내 포퐄 만들기"
              : (plan.id === "artist" ? "POPOK Artist 참여하기" : "Student 시작하기");

            return (
              <PremiumPlanCard
                key={plan.id}
                name={plan.name}
                tagline={plan.tagline}
                price={billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                originalPrice={billingCycle === "monthly" ? plan.originalMonthlyPrice : plan.originalAnnualPrice}
                billingCycle={billingCycle}
                badge={plan.badge}
                highlight={plan.highlight}
                features={plan.features}
                ctaLabel={ctaLabel}
                onSubscribe={() => handleSubscribe(plan.id, billingCycle)}
              />
            );
          })}
        </div>

        <div style={{ textAlign: "center", color: "var(--ink-faint)", fontSize: "0.78rem", marginTop: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ margin: 0 }}>결제 시스템은 준비 중이에요. 지금 신청하시면 오픈 시 가장 먼저 안내드려요.</p>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--ink-muted)" }}>POPOK Company 기능은 준비 중입니다.</p>
        </div>
      </section>

      {/* ── 3. 왜 POPOK ARTIST인가 & 제공하는 가치 ── */}
      <section className="premium-section" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>

          <div style={{ maxWidth: "640px", marginBottom: "64px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--accent-dark)", fontWeight: 800, letterSpacing: "0.1em", display: "block", marginBottom: "12px" }}>
              WHY POPOK ARTIST
            </span>
            <h2 className="display" style={{ fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              왜 POPOK Artist인가요?
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--ink-muted)", lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
              예술가는 포트폴리오를 구축하고, 스스로를 홍보하며, 소셜 미디어 콘텐츠를 제작하고, 번거로운 활동 데이터 정리까지 직접 감당해야 하는 경우가 빈번합니다. POPOK Artist는 AI 매니저 시스템과 숙련된 POPOK 매니지먼트 팀이 파트너로서 함께 그 일련의 과정을 전담하여 아티스트의 시간을 고귀한 창작 활동에만 쓰이도록 돕는 혁신적인 프로그램입니다.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {VALUE_ITEMS.map((item, idx) => (
              <div key={idx} className="card" style={{ padding: "32px 28px", border: "1.5px solid var(--border)", borderRadius: "16px", background: "#FFFFFF" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.01em" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 4. AI와 POPOK의 역할 구분 ── */}
      <section className="premium-section" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--accent-dark)", fontWeight: 800, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              HYBRID SYSTEM
            </span>
            <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              AI와 사람이 함께 일합니다
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", marginTop: "12px", fontWeight: 500 }}>
              자동화된 AI 기술과 사람의 감각적인 기획력이 상호 결합한 차별화된 매니지먼트 시스템입니다.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
            {/* AI 역할 카드 */}
            <div style={{
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              borderRadius: "20px",
              padding: "36px 32px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span style={{ fontSize: "1.8rem" }}>🤖</span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 950, color: "var(--navy)", margin: 0 }}>
                  AI가 함께
                </h3>
              </div>
              <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>포트폴리오 관리 :</strong> 흩어져 있는 아티스트의 프로필 정보와 대외 활동을 체계적으로 수집하고 정리합니다.
                </li>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>활동 업데이트 :</strong> 새로운 활동 기록이 감지되거나 업로드되면 포트폴리오 구조에 맞추어 레이아웃 배치를 연산합니다.
                </li>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>공연 모니터링 :</strong> 아티스트 관련 신규 공연/전시 오픈 뉴스나 예매처 데이터 등을 상시로 모니터링합니다.
                </li>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>프로필 정리 :</strong> 팜플렛, 리플렛 등 복잡한 텍스트 뭉치에서 수상 연혁, 참여 스태프 등의 유효 정보를 빠르게 정제합니다.
                </li>
              </ul>
            </div>

            {/* POPOK 팀의 역할 카드 */}
            <div style={{
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              borderRadius: "20px",
              padding: "36px 32px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span style={{ fontSize: "1.8rem" }}>✨</span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 950, color: "var(--navy)", margin: 0 }}>
                  POPOK이 함께
                </h3>
              </div>
              <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>공연 홍보 :</strong> 아티스트의 다가오는 무대 정보나 창작 활동 소식을 더 많은 관객이 볼 수 있도록 마케팅합니다.
                </li>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>홍보 콘텐츠 제작 :</strong> 관객의 흥미를 유발할 수 있는 카드뉴스, SNS 소통용 소개 숏폼 콘텐츠 등을 고감도로 편집·제작합니다.
                </li>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>플랫폼 메인 노출 & SNS 소개 :</strong> 포포크 웹 플랫폼의 최상단 주요 롤링 영역과 활성화된 공식 채널을 통해 아티스트를 피쳐드합니다.
                </li>
                <li style={{ fontSize: "0.92rem", color: "var(--ink-muted)", fontWeight: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)", fontWeight: 800 }}>새로운 기회 연결 :</strong> 극장, 기획사, 단체 등에서 캐스팅이나 프로젝트 의뢰가 올 때, 조건에 어울리는 소속 아티스트를 직접 연계합니다.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. FAQ ── */}
      <section className="premium-section" style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              FAQ
            </span>
            <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              궁금한 점이 있나요?
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = !!openFaqIndexes[idx];
              const answerId = `premium-faq-answer-${idx}`;
              return (
                <div key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: "100%", background: "none", border: "none", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: "16px", padding: "20px 4px", minHeight: "56px", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)" }}>
                      Q. {item.question}
                    </span>
                    <span aria-hidden="true" style={{
                      fontSize: "1rem", color: "var(--navy)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease", flexShrink: 0,
                    }}>
                      ↓
                    </span>
                  </button>
                  <div
                    id={answerId}
                    style={{
                      overflow: "hidden",
                      maxHeight: isOpen ? "320px" : "0px",
                      transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p style={{ fontSize: "0.9rem", color: "var(--ink-muted)", lineHeight: 1.65, padding: "0 4px 22px" }}>
                      A. {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        .plans-grid {
          display: grid;
          gap: 24px;
        }
        @media (min-width: 961px) {
          .plans-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 960px) and (min-width: 681px) {
          .plans-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 680px) {
          .plans-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
