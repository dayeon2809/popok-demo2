"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface SupportItem {
  title: string;
  note: string;
  premium?: boolean;
}

const ITEMS: SupportItem[] = [
  { title: "나만의 포트폴리오 페이지", note: "작품과 활동 이력을 보기 좋은 한 페이지로 정리해요." },
  { title: "링크 하나로 간편하게 공유", note: "지원·협업·홍보가 필요한 순간, 최신 포트폴리오를 바로 보내요." },
  { title: "새로운 활동을 계속 기록", note: "공연과 작품이 생길 때마다 직접 추가하며 나만의 기록을 쌓아요." },
  { title: "AI로 포트폴리오 빠르게 완성", note: "흩어진 이력과 자료를 AI가 정리해 포트폴리오 초안을 만들어드려요.", premium: true },
  { title: "포트폴리오 정기 업데이트", note: "새로운 공연과 작품이 생길 때마다 POPOK이 확인해 최신 상태로 관리해드려요.", premium: true },
  { title: "인스타그램 홍보 콘텐츠 제작·업로드", note: "새로운 공연과 활동을 콘텐츠로 제작해 POPOK 공식 인스타그램에 소개해드려요.", premium: true },
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
          작품과 이력을 한곳에 기록하고, 더 많은 사람과 새로운 기회에 연결할 수 있어요.
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
