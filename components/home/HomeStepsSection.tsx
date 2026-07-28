"use client";

import Link from "next/link";
import { analytics } from "@/lib/analytics";

const STEPS = [
  { n: "01", text: "이력서나 활동 내용을 입력해요" },
  { n: "02", text: "AI가 이력과 작품을 정리해요" },
  { n: "03", text: "내 주소로 바로 공유해요" },
];

interface HomeStepsSectionProps {
  ctaHref: string;
  isLoggedIn: boolean;
}

export default function HomeStepsSection({ ctaHref, isLoggedIn }: HomeStepsSectionProps) {
  return (
    <section className="home-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "64px 24px",
      borderTop: "1px solid var(--border)",
      textAlign: "center",
    }}>
      <h2 className="display" style={{
        fontSize: "clamp(1.6rem, 3.6vw, 2.3rem)",
        color: "var(--navy)",
        fontWeight: 950,
        letterSpacing: "-0.03em",
        margin: "0 0 40px",
      }}>
        포퐄 만들기, 생각보다 쉬워요
      </h2>

      <div className="home-steps-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        marginBottom: "36px",
        textAlign: "left",
      }}>
        {STEPS.map((step) => (
          <div key={step.n} style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--border)",
            borderRadius: "16px",
            padding: "26px 22px",
          }}>
            <span className="mono" style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "var(--accent-dark)", marginBottom: "12px" }}>
              {step.n}
            </span>
            <p style={{ fontSize: "1rem", color: "var(--navy)", fontWeight: 800, margin: 0, lineHeight: 1.4 }}>
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <Link
        href={ctaHref}
        onClick={() => analytics.homeCreatePopokClicked("steps", isLoggedIn)}
        className="btn-lime"
        style={{
          textDecoration: "none",
          padding: "15px 32px",
          borderRadius: "999px",
          fontSize: "0.9rem",
          fontWeight: 800,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        3분 만에 시작하기 <span style={{ fontSize: "1.05rem" }}>→</span>
      </Link>
    </section>
  );
}
