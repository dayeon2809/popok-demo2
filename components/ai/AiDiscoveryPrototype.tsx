"use client";

import { useState } from "react";
import type { DiscoveryMode } from "@/lib/aiDiscovery";
import AiDiscoveryPanel from "./AiDiscoveryPanel";

// Real, working AI Artist Discovery entry point (feature/home-feed-v2) —
// see app/api/ai/discover-artists/route.ts + lib/aiDiscovery.ts for the
// server-side implementation. This component is just the trigger (search
// bar on Home, or a labeled button on the artist page); AiDiscoveryPanel
// does the actual search + image-first results.

interface AiDiscoveryPrototypeProps {
  variant?: "bar" | "button";
  label?: string;
  placeholder?: string;
  mode?: DiscoveryMode;
  contextArtistId?: string;
  contextArtistName?: string;
  /** Pre-filled query. For variant="button" with autoSearch, this runs immediately. */
  defaultQuery?: string;
  /** Skip the input step and search immediately with defaultQuery (used by "비슷한 작업 찾기" style buttons). */
  autoSearch?: boolean;
  /** Fired when a variant="button" trigger is clicked, before the panel opens — analytics hook, purely additive. */
  onButtonClick?: () => void;
}

export default function AiDiscoveryPrototype({
  variant = "bar",
  label,
  placeholder,
  mode = "discover",
  contextArtistId,
  contextArtistName,
  defaultQuery = "",
  autoSearch = false,
  onButtonClick,
}: AiDiscoveryPrototypeProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const openPanel = () => setOpen(true);

  if (variant === "button") {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            onButtonClick?.();
            openPanel();
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", borderRadius: "999px", border: "1.5px solid var(--border-dark)",
            background: "#FFFFFF", color: "var(--navy)", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          ✦ {label || "비슷한 작업 찾아보기"}
        </button>
        {open && (
          <AiDiscoveryPanel
            mode={mode}
            contextArtistId={contextArtistId}
            contextArtistName={contextArtistName}
            defaultQuery={defaultQuery}
            autoSearch={autoSearch}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <form
        className="discovery-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          openPanel();
        }}
        style={{
          display: "flex", alignItems: "center", gap: "10px", width: "100%", maxWidth: "560px",
          margin: "0 auto", padding: "12px 18px", borderRadius: "999px",
          border: "1.5px solid var(--border-dark)", background: "#FFFFFF",
        }}
      >
        <span aria-hidden="true" style={{ color: "var(--accent-dark)", fontSize: "1rem" }}>✦</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={openPanel}
          placeholder={placeholder || "어떤 작업이나 아티스트를 찾고 있나요?"}
          style={{
            flex: 1, border: "none", outline: "none", fontSize: "0.9rem",
            fontFamily: "inherit", color: "var(--navy)", background: "transparent",
          }}
        />
        <button
          type="submit"
          className="btn-lime"
          style={{
            border: "none", borderRadius: "999px",
            padding: "7px 16px", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          탐색
        </button>
      </form>
      {open && (
        <AiDiscoveryPanel
          mode={mode}
          contextArtistId={contextArtistId}
          contextArtistName={contextArtistName}
          defaultQuery={query}
          autoSearch={Boolean(query.trim())}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
