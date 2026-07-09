"use client";

import { useState } from "react";
import { faqItems } from "@/data/faq";

export default function FAQSection() {
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setOpenIndexes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="home-section" style={{ background: "var(--bg-warm)", padding: "100px 32px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
            FAQ
          </span>
          <h2 className="display" style={{
            fontSize: "clamp(2rem, 4vw, 2.6rem)",
            color: "var(--navy)",
            fontWeight: 900,
            letterSpacing: "-0.03em"
          }}>
            궁금한 점이 있나요?
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqItems.map((item, idx) => {
            const isOpen = !!openIndexes[idx];
            const answerId = `faq-answer-${idx}`;
            return (
              <div key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggle(idx)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px 4px",
                    minHeight: "56px",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)" }}>
                    Q. {item.question}
                  </span>
                  <span aria-hidden="true" style={{
                    fontSize: "1rem",
                    color: "var(--navy)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                    flexShrink: 0,
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
                  <p style={{
                    fontSize: "0.9rem",
                    color: "var(--ink-muted)",
                    lineHeight: 1.65,
                    padding: "0 4px 22px",
                  }}>
                    A. {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
