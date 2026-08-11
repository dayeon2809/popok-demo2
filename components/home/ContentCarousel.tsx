"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { POPOK_INSTAGRAM_PROFILE_URL, type InstagramStory } from "@/lib/instagram";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

function formatStoryDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function ContentCard({ story }: { story: InstagramStory }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <a
      href={story.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="card"
      style={{
        minWidth: "280px",
        maxWidth: "280px",
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#EAE6DD", position: "relative" }}>
        <img
          src={imageFailed ? FALLBACK_IMAGE : story.imageUrl}
          alt={story.title}
          loading="lazy"
          onError={() => setImageFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span className="tag-navy" style={{ position: "absolute", top: "12px", left: "12px" }}>
          {story.category}
        </span>
        {(story.mediaType === "VIDEO" || story.mediaType === "REELS") && (
          <span aria-label="재생 가능한 영상" style={{
            position: "absolute", bottom: "12px", right: "12px",
            width: "30px", height: "30px", borderRadius: "50%",
            background: "rgba(23, 20, 17, 0.55)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="#FFFFFF"><path d="M0 0L12 7L0 14V0Z" /></svg>
          </span>
        )}
      </div>
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}>
        <h3 style={{
          fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", margin: 0, letterSpacing: "-0.01em",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {story.title}
        </h3>
        <div style={{
          marginTop: "auto", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)",
        }}>
          <span>{formatStoryDate(story.publishedAt)}</span>
          <span>Instagram ↗</span>
        </div>
      </div>
    </a>
  );
}

interface ContentCarouselProps {
  stories: InstagramStory[];
}

export default function ContentCarousel({ stories }: ContentCarouselProps) {
  if (stories.length === 0) return null;

  return (
    <section className="home-section content-carousel-section" style={{
      padding: "80px 24px",
      maxWidth: "1120px",
      margin: "0 auto",
      borderTop: "1px solid var(--border)",
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: "32px", maxWidth: "640px" }}
      >
        <h2 className="display" style={{
          fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}>
          예술가의 활동을 콘텐츠로 소개합니다
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
          공연 소식, 아티스트 인터뷰, 작품 이야기를
          POPOK의 콘텐츠로 더 많은 사람에게 전합니다.
        </p>
        <a href={POPOK_INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "10px",
          fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)",
          textDecoration: "underline", textUnderlineOffset: "3px",
        }}>
          Instagram에서 더 보기 ↗
        </a>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="no-scrollbar" 
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          padding: "4px 4px 12px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {stories.map((story) => (
          <ContentCard key={story.id} story={story} />
        ))}
      </motion.div>
    </section>
  );
}

