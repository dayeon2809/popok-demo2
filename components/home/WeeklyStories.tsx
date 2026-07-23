"use client";

import { useEffect, useRef, useState } from "react";
import type { InstagramStory } from "@/lib/instagram";
import InstagramStoryCard from "./InstagramStoryCard";

interface WeeklyStoriesProps {
  stories: InstagramStory[];
  /** true when INSTAGRAM_ACCESS_TOKEN is set — lets an empty `stories` array
   *  distinguish "not configured yet" from "API call came back empty" (or no
   *  post has the #홈노출 hashtag yet) for the dev-only notice below. Never
   *  shown in production. */
  configured: boolean;
}

// Server-fetched by app/page.tsx (getWeeklyStories) and passed down as plain
// data — matches how initialArtists/initialPerformances/initialCompanies
// already reach HomeClient. Renders as a full-bleed, swipeable "card news"
// carousel (one large slide at a time, dot pagination) at the very top of
// the homepage, above the hero.
export default function WeeklyStories({ stories, configured }: WeeklyStoriesProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (i: number) => {
    const node = trackRef.current;
    if (!node) return;
    node.scrollTo({ left: node.clientWidth * i, behavior: "smooth" });
  };

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const onScroll = () => {
      if (node.clientWidth > 0) {
        setActiveIndex(Math.round(node.scrollLeft / node.clientWidth));
      }
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [stories.length]);

  if (stories.length === 0) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "24px 32px 0" }}>
        <div style={{ padding: "24px", border: "1px dashed var(--border-dark)", borderRadius: "6px", fontSize: "0.85rem", color: "var(--ink-muted)" }}>
          <strong style={{ color: "var(--navy)" }}>[dev only] POPOK&apos;s NEWS 섹션 숨김:</strong>{" "}
          {configured
            ? "INSTAGRAM_ACCESS_TOKEN은 설정되어 있지만 표시할 게시물이 없습니다 (API 실패, 또는 #홈노출 해시태그가 달린 게시물이 없음 — 서버 콘솔 로그 확인)."
            : "INSTAGRAM_ACCESS_TOKEN 환경변수가 설정되지 않았습니다. .env.local에 값을 채우면 이 섹션이 나타납니다."}
        </div>
      </section>
    );
  }

  return (
    <section className="news-carousel-section">
      <style dangerouslySetInnerHTML={{ __html: `
        .news-carousel-track {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
        }
        .news-carousel-track::-webkit-scrollbar { display: none; }
        .news-slide-wrap {
          flex: 0 0 100%;
          scroll-snap-align: start;
        }
        .news-slide {
          position: relative;
          display: block;
          width: 100%;
          height: 460px;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          background: var(--navy);
        }
        .news-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .news-slide-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 32px 40px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.35) 55%, rgba(0, 0, 0, 0) 100%);
          color: #FFFFFF;
        }
        .news-slide-category {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }
        .news-slide-title {
          font-size: clamp(1.15rem, 3vw, 1.6rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.35;
          margin: 0 0 8px;
          max-width: 640px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-slide-excerpt {
          font-size: 0.85rem;
          line-height: 1.5;
          opacity: 0.85;
          margin: 0 0 14px;
          max-width: 580px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-slide-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.75rem;
          font-weight: 700;
          opacity: 0.9;
        }
        .news-carousel-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 14px 0;
        }
        .news-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: none;
          background: var(--border-dark);
          cursor: pointer;
          padding: 0;
          transition: width 0.2s ease, background 0.2s ease, border-radius 0.2s ease;
        }
        .news-dot--active {
          width: 20px;
          border-radius: 4px;
          background: var(--navy);
        }
        @media (max-width: 640px) {
          .news-slide { height: 320px; }
          .news-slide-overlay { padding: 14px 18px; }
          .news-slide-category { font-size: 0.62rem; margin-bottom: 4px; }
          .news-slide-title { font-size: 1rem; -webkit-line-clamp: 1; margin-bottom: 4px; }
          .news-slide-excerpt { font-size: 0.75rem; -webkit-line-clamp: 1; margin-bottom: 6px; }
          .news-slide-meta { font-size: 0.7rem; }
        }
      ` }} />

      <div className="news-carousel-track" ref={trackRef}>
        {stories.map((story) => (
          <div className="news-slide-wrap" key={story.id}>
            <InstagramStoryCard story={story} />
          </div>
        ))}
      </div>

      {stories.length > 1 && (
        <div className="news-carousel-dots">
          {stories.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 소식`}
              className={i === activeIndex ? "news-dot news-dot--active" : "news-dot"}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
