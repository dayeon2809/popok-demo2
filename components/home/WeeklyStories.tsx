import type { InstagramStory } from "@/lib/instagram";
import InstagramStoryCard from "./InstagramStoryCard";

const POPOK_INSTAGRAM_URL = "https://www.instagram.com/popok.official/";

interface WeeklyStoriesProps {
  stories: InstagramStory[];
  /** true when INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_USER_ID are both set — lets an
   *  empty `stories` array distinguish "not configured yet" from "API call
   *  came back empty" for the dev-only notice below. Never shown in production. */
  configured: boolean;
}

// Server-fetched by app/page.tsx (getWeeklyStories) and passed down as plain
// data — this file itself does no fetching, matching how initialArtists/
// initialPerformances/initialCompanies already reach HomeClient. Only
// InstagramStoryCard is a client component (needs local state for image
// load-error fallback); this component is a plain mapper.
export default function WeeklyStories({ stories, configured }: WeeklyStoriesProps) {
  if (stories.length === 0) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <section className="home-section" style={{ maxWidth: "1120px", margin: "0 auto", padding: "60px 32px", borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "24px", border: "1px dashed var(--border-dark)", borderRadius: "6px", fontSize: "0.85rem", color: "var(--ink-muted)" }}>
          <strong style={{ color: "var(--navy)" }}>[dev only] 이주의 소식 섹션 숨김:</strong>{" "}
          {configured
            ? "INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID는 설정되어 있지만 표시할 게시물이 없습니다 (API 실패 또는 조건에 맞는 게시물 없음 — 서버 콘솔 로그 확인)."
            : "INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID 환경변수가 설정되지 않았습니다. .env.local에 값을 채우면 이 섹션이 나타납니다."}
        </div>
      </section>
    );
  }

  const [featured, ...rest] = stories;

  return (
    <section className="home-section weekly-stories-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "60px 32px",
      borderTop: "1px solid var(--border)",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .weekly-stories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .weekly-story-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          background: #FFFFFF;
          border: 1.5px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(23, 20, 17, 0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .weekly-story-card:hover {
          border-color: var(--navy);
          box-shadow: 0 12px 28px rgba(23, 20, 17, 0.08);
        }
        .weekly-story-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 1.2;
          overflow: hidden;
          background: #FAF9F5;
        }
        .weekly-story-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .weekly-story-card:hover .weekly-story-thumb img {
          transform: scale(1.03);
        }
        .weekly-story-play-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(23, 20, 17, 0.75);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
        }
        .weekly-story-info {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .weekly-story-category {
          font-size: 0.62rem;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .weekly-story-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 4px;
          letter-spacing: -0.01em;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .weekly-story-excerpt {
          font-size: 0.78rem;
          color: var(--ink-muted);
          line-height: 1.5;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .weekly-story-meta {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--border-light, var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .weekly-story-date {
          font-size: 0.68rem;
          color: var(--ink-faint);
        }
        .weekly-story-ig {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--navy);
        }

        /* Featured card — wide, image+text side by side on desktop */
        .weekly-story-card--featured {
          grid-column: 1 / -1;
          flex-direction: row;
        }
        .weekly-story-card--featured .weekly-story-thumb {
          width: 55%;
          aspect-ratio: 1.5;
          flex-shrink: 0;
        }
        .weekly-story-card--featured .weekly-story-info {
          padding: 28px;
          justify-content: center;
        }
        .weekly-story-card--featured .weekly-story-title {
          font-size: 1.3rem;
          -webkit-line-clamp: 3;
        }
        .weekly-story-card--featured .weekly-story-excerpt {
          font-size: 0.9rem;
          -webkit-line-clamp: 3;
        }

        @media (max-width: 900px) {
          .weekly-stories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .weekly-stories-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .weekly-story-card--featured {
            flex-direction: column;
          }
          .weekly-story-card--featured .weekly-story-thumb {
            width: 100%;
            aspect-ratio: 1.4;
          }
          .weekly-story-card--featured .weekly-story-title {
            font-size: 1.05rem;
          }
        }
      ` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
            이주의 소식 · THIS WEEK&apos;S STORIES
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: 500 }}>
            POPOK이 발견하고 기록한 예술인들의 새로운 이야기
          </span>
        </div>
        <a
          href={POPOK_INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          인스타그램에서 더 보기 ↗
        </a>
      </div>

      <div className="weekly-stories-grid">
        <InstagramStoryCard story={featured} featured />
        {rest.map((story) => (
          <InstagramStoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}
