"use client";

import { useState } from "react";
import Link from "next/link";
import PremiumPlanCard, { type BillingCycle } from "@/components/PremiumPlanCard";

type PlanId = "free" | "student" | "artist";

interface PlanDef {
  id: PlanId;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  annualPrice: number;
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
    badge: "첫 1개월 무료",
    features: [
      "프로필 주기 업데이트",
      "이메일로 작업 자료 제출",
      "인스타그램 기반 작업 확인",
      "대표 영상 및 사진 교체",
      "작품 및 공연 이력 업데이트",
      "학생 인증 기능은 추후 추가 예정",
    ],
  },
  {
    id: "artist",
    name: "Artist",
    tagline: "활발히 활동하는 아티스트를 위한 정기 관리 플랜",
    monthlyPrice: 5900,
    annualPrice: 59000,
    badge: "첫 1개월 무료",
    highlight: true,
    features: [
      "정기 포트폴리오 관리",
      "공연 및 작품 이력 업데이트",
      "유튜브 영상 정리",
      "인스타그램 기반 활동 확인",
      "대표 사진 및 영상 업데이트",
      "공개 프로필 우선 관리",
      "향후 커스텀 도메인 연결 가능",
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
    question: "첫 달은 정말 무료인가요?",
    answer: "네, Student·Artist 플랜 모두 첫 1개월은 무료로 이용하실 수 있어요. 이후부터 선택하신 주기에 따라 요금이 안내될 예정입니다.",
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

  // 실제 결제 연동 전까지는 안내 메시지만 표시한다.
  const handleSubscribe = (planType: PlanId, cycle: BillingCycle) => {
    // TODO: 결제 연동 시 아래 엔드포인트와 연결
    // const res = await fetch("/api/checkout/create-subscription", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ planType, billingCycle: cycle }),
    // });
    // const { checkoutUrl } = await res.json();
    // window.location.href = checkoutUrl; // Toss Payments / Stripe 결제 페이지로 이동 예정
    triggerToast("아직 공개 전이에요.\nPOPOK 팀이 정리 후 이메일로 안내드릴게요.");
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
          첫 1개월 무료
        </span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "20px" }}>
          포트폴리오, 이제 직접<br />업데이트하지 마세요.
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--ink-muted)", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
          POPOK Premium은 아티스트의 작업 기록을 주기적으로 정리하고, 프로필 페이지를 최신 상태로 유지해주는 구독 서비스입니다.
        </p>
      </section>

      {/* ── 2. SERVICE PREPARING STATUS PANEL (구독 요금제 준비중 숨김) ── */}
      <section style={{ maxWidth: "600px", margin: "0 auto 80px", padding: "0 32px" }}>
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(23, 20, 17, 0.03)"
        }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: "#FFF7ED", border: "1px solid #FDBA74",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "20px", color: "#EA580C", fontSize: "1.6rem", fontWeight: 900
          }}>
            !
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--navy)", marginBottom: "12px" }}>
            Premium 구독 서비스 준비 중
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "28px" }}>
            아티스트의 정기 프로필 업데이트 및 맞춤 관리를 지원하는 Premium 플랜 서비스는 현재 준비 중입니다.<br />
            준비가 완료되면 등록 시 기입하신 이메일로 빠르게 안내드릴게요!
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Link href="/submit" className="btn-lime" style={{ textDecoration: "none", padding: "13px 24px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 900 }}>
              기본 아티스트 무료 등록하기
            </Link>
          </div>
        </div>
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
