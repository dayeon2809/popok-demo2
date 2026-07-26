"use client";

import { useState } from "react";
import type { Company } from "@/types";
import CompanyDiscoveryPanel from "./CompanyDiscoveryPanel";

interface CompanyDiscoveryPrototypeProps {
  companies: Company[];
  placeholder?: string;
}

export default function CompanyDiscoveryPrototype({
  companies,
  placeholder,
}: CompanyDiscoveryPrototypeProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const openPanel = () => setOpen(true);

  return (
    <>
      <form
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
          placeholder={placeholder || "어떤 작업이나 단체를 찾고 있나요?"}
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
        <CompanyDiscoveryPanel
          companies={companies}
          defaultQuery={query}
          autoSearch={Boolean(query.trim())}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
