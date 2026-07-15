"use client";

import { useState } from "react";
import PremiumPlanCard, { type BillingCycle } from "@/components/PremiumPlanCard";

type PlanId = "free" | "student" | "artist";

interface PlanDef {
  id: PlanId;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  annualPrice: number;
  originalMonthlyPrice?: number;
  originalAnnualPrice?: number;
  badge?: string;
  highlight?: boolean;
  features: string[];
}

const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    tagline: "지금 POPOK에 등록하는 모든 아티스트의 기본 플랜",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "기본 아티스트 프로필 페이지",
      "직접 제출한 정보 기반 등록",
      "POPOK 팀 검수 후 공개",
      "기본 작품 아카이브",
    ],
  },
  {
    id: "student",
    name: "Student",
    tagline: "학업과 활동을 병행하는 아티스트를 위한 플랜",
    monthlyPrice: 3900,
    annualPrice: 39000,
    originalMonthlyPrice: 4900,
    originalAnnualPrice: 49000,
    badge: "오픈 이벤트가 · 평생 유지",
    features: [
      "포트폴리오 제작",
      "작품 관리",
      "QR 명함",
      "링크 공유",
    ],
  },
  {
    id: "artist",
    name: "Premium",
    tagline: "활발히 활동하는 아티스트를 위한 정기 관리 플랜",
    monthlyPrice: 6900,
    annualPrice: 69000,
    originalMonthlyPrice: 9900,
    originalAnnualPrice: 99000,
    badge: "얼리버드 한정가",
    highlight: true,
    features: [
      "Student 기능 모두 포함",
      "AI 활동 모니터링",
      "월 1회 업데이트 지원",
      "프로필 분석",
      "무제한 아티스트 탐색",
    ],
  },
];

const UPDATE_STEPS = [
  {
    meta: "01",
    title: "이메일로 작업 보내기",
    body: "공연명, 작품명, 프로필 사진, 공연 사진, 유튜브 영상 링크, 역할 및 크레딧을 보내주시면 됩니다.",
  },
  {
    meta: "02",
    title: "인스타그램 기반 확인",
    body: "원하시는 경우 POPOK 팀이 공개된 인스타그램 계정을 확인하며 새로운 공연·작업 소식을 함께 살펴봐 드려요. 자동으로 수집되는 것이 아니라, 팀이 직접 확인하고 정리하는 방식이에요.",
  },
  {
    meta: "03",
    title: "POPOK 팀이 정리",
    body: "받은 자료를 바로 공개하지 않고, 작품명·역할·연도·영상·이미지 등을 POPOK 팀이 다시 한 번 정리합니다.",
  },
  {
    meta: "04",
    title: "프로필 업데이트",
    body: "정리된 내용을 아티스트 개인 POPOK 페이지에 반영해 최신 상태로 유지해드려요.",
  },
];

const FAQ_ITEMS = [
  {
    question: "오픈 이벤트 가격은 언제까지 적용되나요?",
    answer: "지금 가입하시면 Student는 3,900원을 평생 유지해드리고, Premium은 얼리버드 한정으로 6,900원에 이용하실 수 있어요. 이벤트가 끝나면 각각 4,900원, 9,900원으로 전환될 예정이라 지금 가입하시는 것이 가장 유리해요.",
  },
  {
    question: "포트폴리오 업데이트는 어떻게 요청하나요?",
    answer: "이메일로 공연명, 작품명, 사진, 영상 링크 등을 보내주시면 POPOK 팀이 정리해서 프로필에 반영해드려요.",
  },
  {
    question: "인스타그램을 꼭 공개해야 하나요?",
    answer: "아니요, 필수는 아니에요. 다만 공개 계정을 공유해주시면 POPOK 팀이 새로운 활동 소식을 함께 확인하고 정리하는 데 도움이 됩니다.",
  },
  {
    question: "어떤 자료를 보내야 하나요?",
    answer: "공연명, 작품명, 프로필 사진, 공연 사진, 유튜브 영상 링크, 역할 및 크레딧 등을 보내주시면 됩니다. 자료가 일부만 있어도 괜찮아요.",
  },
  {
    question: "구독을 해지하면 기존 프로필은 사라지나요?",
    answer: "아니요, 사라지지 않아요. 다만 이후로는 정기 업데이트 관리가 제공되지 않고 Free 플랜 기준으로 유지됩니다.",
  },
  {
    question: "결제는 언제부터 가능한가요?",
    answer: "현재는 결제 기능이 아직 공개되지 않았어요. 준비가 완료되면 이메일로 안내드릴게요.",
  },
  {
    question: "단체(무용단·기획사 등)도 Premium에 가입할 수 있나요?",
    answer: "Premium은 개인 아티스트를 위한 구독 플랜이에요. 단체는 별도의 신청 폼을 통해 접수해주시면 POPOK 운영팀이 인터뷰를 통해 포트폴리오 제작을 직접 도와드려요.",
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

  // 실제 결제 연동 전까지는 사전 신청(안내 접수) 메시지만 표시한다.
  const handleSubscribe = (planType: PlanId, cycle: BillingCycle) => {
    // TODO: 결제 연동 시 아래 엔드포인트와 연결
    // const res = await fetch("/api/checkout/create-subscription", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ planType, billingCycle: cycle }),
    // });
    // const { checkoutUrl } = await res.json();
    // window.location.href = checkoutUrl; // Toss Payments / Stripe 결제 페이지로 이동 예정
    triggerToast("사전 신청이 접수됐어요!\n결제 오픈 시 이메일로 가장 먼저 안내드릴게요.");
  };

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh" }}>
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

      {/* ── 1. TOP SECTION ── */}
      <section className="premium-section" style={{ maxWidth: "760px", margin: "0 auto", padding: "100px 32px 60px", textAlign: "center" }}>
        <span className="tag" style={{ background: "var(--accent)", color: "var(--navy)", border: "none", marginBottom: "20px", display: "inline-block" }}>
          🎉 오픈 이벤트 · 얼리버드 특가
        </span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "20px" }}>
          포트폴리오, 이제 직접<br />업데이트하지 마세요.
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--ink-muted)", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
          POPOK Premium은 아티스트의 작업 기록을 주기적으로 정리하고, 프로필 페이지를 최신 상태로 유지해주는 구독 서비스입니다.
        </p>
      </section>

      {/* ── 2. BILLING TOGGLE + PRICING PLANS ── */}
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          {PLANS.map((plan) => {
            const isFreePlan = plan.monthlyPrice === 0;

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
                ctaLabel={isFreePlan ? "무료로 시작하기" : "구독 신청하기"}
                onSubscribe={() => handleSubscribe(plan.id, billingCycle)}
              />
            );
          })}
        </div>

        <p style={{ textAlign: "center", color: "var(--ink-faint)", fontSize: "0.78rem", marginTop: "24px" }}>
          결제 시스템은 준비 중이에요. 지금 신청하시면 오픈 시 가장 먼저 안내드려요.
        </p>
      </section>

      {/* ── 4. HOW UPDATES WORK ── */}
      <section className="premium-section" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "100px 32px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              HOW IT WORKS
            </span>
            <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              어떻게 업데이트되나요?
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            {UPDATE_STEPS.map((step) => (
              <div key={step.meta} className="card" style={{ padding: "28px 22px" }}>
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "14px" }}>
                  {step.meta}
                </span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", marginBottom: "10px", letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.84rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  {step.body}
                </p>
              </div>
            ))}
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
    </div>
  );
}
