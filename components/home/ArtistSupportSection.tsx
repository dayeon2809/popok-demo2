"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface SupportItem {
  title: string;
  note: string;
  premium?: boolean;
}

const ITEMS: SupportItem[] = [
  { title: "나만의 포트폴리오 페이지", note: "지금까지의 작품과 이력이 한 페이지에 남습니다." },
  { title: "하나의 링크로 활동 공유", note: "필요할 때 최신 포트폴리오를 바로 전달합니다." },
  { title: "활동 기록 계속 쌓기", note: "새 작품과 공연을 기존 기록에 이어서 더합니다." },
  { title: "AI로 자료 초안 정리", note: "흩어진 자료를 빠르게 정리해 기록을 시작합니다.", premium: true },
  { title: "다가오는 활동 반영", note: "새 공연과 작품이 포트폴리오에 빠르게 이어집니다.", premium: true },
  { title: "포트폴리오 정기 관리", note: "새로운 활동이 생길 때마다 계속 최신 상태로 관리합니다.", premium: true },
];

export default function ArtistSupportSection() {
  return (
    <section className="home-section artist-support-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "80px 24px",
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: "36px", maxWidth: "640px" }}
      >
        <h2 className="display" style={{
          fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}>
          POPOK 아티스트가 되면
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
          등록하면 작품과 이력을 바로 기록할 수 있어요
        </p>
      </motion.div>

      <div className="artist-support-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "14px",
      }}>
        {ITEMS.map((item, i) => (
          <motion.div 
            key={item.title} 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -2, borderColor: "var(--navy)" }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "18px 20px",
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              borderRadius: "14px",
              boxShadow: "0 4px 10px rgba(23,20,17,0.01)",
              transition: "border-color 0.2s, transform 0.2s"
            }}
          >
            <span style={{
              flexShrink: 0,
              width: "22px", height: "22px", borderRadius: "50%",
              background: "var(--accent)", color: "var(--navy)",
              fontSize: "0.7rem", fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: "1px",
            }}>
              ✓
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.01em" }}>
                  {item.title}
                </span>
                {item.premium && (
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 900, color: "var(--navy)",
                    background: "var(--accent)", padding: "2px 7px", borderRadius: "6px",
                    letterSpacing: "0.02em",
                  }}>
                    Premium
                  </span>
                )}
              </div>
              {item.note && (
                <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", fontWeight: 600, margin: "4px 0 0" }}>
                  {item.note}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ marginTop: "28px" }}
      >
        <Link href="/auth" className="btn-lime" style={{
          textDecoration: "none",
          padding: "14px 28px",
          borderRadius: "999px",
          fontSize: "0.9rem",
          fontWeight: 800,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}>
          내 포퐄 만들기 <span style={{ fontSize: "1.05rem" }}>→</span>
        </Link>
      </motion.div>
    </section>
  );
}

