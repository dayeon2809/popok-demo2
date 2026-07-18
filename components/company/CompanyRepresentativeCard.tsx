"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import type { Company } from "@/types";

export interface RepresentativeArtist {
  id: string;
  name: string;
  name_en?: string | null;
  profile_image_url?: string | null;
  slug?: string | null;
  instagram?: string | null;
  website?: string | null;
  email?: string | null;
  role?: string | null;
}

interface CompanyRepresentativeCardProps {
  company: Company;
  representative: RepresentativeArtist | null;
  /** Whether the front DigitalCard is currently flipped to its back face — gates the peek trigger. */
  isCompanyFlipped?: boolean;
  /** Whether this card has been brought to the front of the stack. */
  isActive?: boolean;
  onActivate?: () => void;
  onClose?: () => void;
}

// Real, verifiable fields only — this must never be used to invent a
// representative when no artist_companies relation (or brand field) exists.
export function hasRepresentativeCardData(
  company: Company,
  representative: RepresentativeArtist | null
): boolean {
  if (representative) return true;
  return Boolean(company.logo_url || company.name_en || company.brand_color || company.email);
}

function cleanInstagramHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleaned = url.trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("@")) return cleaned;
  try {
    const rawPath = cleaned.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    const username = rawPath.split("/")[0].split("?")[0];
    return username ? `@${username}` : null;
  } catch {
    return null;
  }
}

export default function CompanyRepresentativeCard({
  company,
  representative,
  isCompanyFlipped = false,
  isActive = false,
  onActivate,
  onClose,
}: CompanyRepresentativeCardProps) {
  // The surface button doubles as an "open" trigger (peeking) and a "close"
  // trigger (active, clicking empty card area) — whichever it was last used
  // for, focus should return to it once the card closes.
  const surfaceRef = useRef<HTMLButtonElement>(null);
  const wasActiveRef = useRef(isActive);

  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      surfaceRef.current?.focus();
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  if (!hasRepresentativeCardData(company, representative)) return null;

  const brandAccent = company.brand_color || null;

  // ── Representative variant: a real artist_companies (is_primary && is_current) relation ──
  if (representative) {
    const profileHref = `/artists/${encodeURIComponent(representative.slug || representative.id)}`;
    const igHandle = cleanInstagramHandle(representative.instagram);
    const initials = (representative.name || "?").trim().charAt(0).toUpperCase();

    return (
      <article className="rep-card-article">
        <style jsx>{`
          .rep-card-article {
            position: relative;
            width: 100%;
          }
          .rep-card {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 100%;
            aspect-ratio: 0.68;
            background: #ffffff;
            border: 1px solid var(--border);
            border-top: 3px solid ${brandAccent || "var(--navy)"};
            border-radius: 6px;
            box-shadow: 0 8px 20px -8px rgba(23, 20, 17, 0.12);
            padding: 14px;
            box-sizing: border-box;
            text-align: left;
            font: inherit;
            color: inherit;
            cursor: pointer;
            appearance: none;
            transition: box-shadow 280ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          .rep-card:disabled {
            cursor: default;
          }
          .rep-card:focus-visible {
            outline: 2px solid var(--navy);
            outline-offset: 2px;
          }
          .rep-card--active {
            box-shadow: 0 24px 50px -12px rgba(23, 20, 17, 0.22);
            transform: scale(1.01);
          }
          .rep-avatar {
            width: 52px;
            height: 52px;
            border-radius: 6px;
            object-fit: cover;
            border: 1px solid var(--border);
            background: #f5f1e8;
          }
          .rep-avatar-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.05rem;
            color: var(--ink-muted);
          }
          .rep-card-close-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 3;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 1px solid var(--border);
            background: #ffffff;
            color: var(--navy);
            font-size: 0.95rem;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
          }
          .rep-card-close-btn:focus-visible {
            outline: 2px solid var(--navy);
            outline-offset: 2px;
          }
          .rep-card-profile-link {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2;
            display: block;
            padding: 10px 14px;
            background: var(--navy);
            color: #ffffff;
            text-align: center;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.02em;
            text-decoration: none;
            border-radius: 0 0 5px 5px;
            box-sizing: border-box;
          }
          .rep-card-profile-link:hover,
          .rep-card-profile-link:focus-visible {
            background: #000000;
          }
          .rep-card-profile-link:focus-visible {
            outline: 2px solid #ffffff;
            outline-offset: -4px;
          }
          @media (prefers-reduced-motion: reduce) {
            .rep-card {
              transition: none;
            }
          }
        `}</style>

        <button
          ref={surfaceRef}
          type="button"
          className={`rep-card${isActive ? " rep-card--active" : ""}`}
          aria-label={
            isActive
              ? "대표자 카드 닫기"
              : `${company.name} 대표 아티스트 ${representative.name} 카드 열기`
          }
          disabled={!isCompanyFlipped}
          onClick={isActive ? onClose : onActivate}
        >
          <span
            className="mono"
            style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--ink-muted)" }}
          >
            REPRESENTATIVE
          </span>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
            {representative.profile_image_url ? (
              <img src={representative.profile_image_url} alt="" className="rep-avatar" />
            ) : company.logo_url ? (
              <img src={company.logo_url} alt="" className="rep-avatar" />
            ) : (
              <div className="rep-avatar rep-avatar-fallback">{initials}</div>
            )}
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.01em" }}>
                {representative.name}
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                {representative.role || "대표"}
              </div>
              {igHandle && (
                <div className="mono" style={{ fontSize: "0.56rem", color: "var(--ink-faint)", marginTop: "4px" }}>
                  {igHandle}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderTop: "1px solid var(--border)",
              paddingTop: "8px",
              minWidth: 0,
            }}
          >
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt=""
                style={{ width: "16px", height: "16px", borderRadius: "3px", objectFit: "cover", flexShrink: 0 }}
              />
            )}
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "var(--ink-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {company.name}
            </span>
          </div>
        </button>

        {isActive && (
          <>
            <button type="button" className="rep-card-close-btn" aria-label="대표자 카드 닫기" onClick={onClose}>
              ×
            </button>
            <Link href={profileHref} className="rep-card-profile-link">
              프로필 보기
            </Link>
          </>
        )}
      </article>
    );
  }

  // ── Brand fallback variant: no representative relation, only real company fields. Decorative only, no interaction. ──
  const initials = (company.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div aria-hidden="true" className="rep-card rep-card-decorative">
      <style jsx>{`
        .rep-card-decorative {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          aspect-ratio: 0.68;
          background: #ffffff;
          border: 1px solid var(--border);
          border-top: 3px solid ${brandAccent || "var(--border)"};
          border-radius: 6px;
          box-shadow: 0 8px 20px -8px rgba(23, 20, 17, 0.12);
          padding: 14px;
          box-sizing: border-box;
        }
        .brand-avatar {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--border);
          background: #f5f1e8;
        }
      `}</style>

      <span
        className="mono"
        style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--ink-muted)" }}
      >
        COMPANY BRAND
      </span>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
        {company.logo_url ? (
          <img src={company.logo_url} alt="" className="brand-avatar" />
        ) : (
          <div
            className="brand-avatar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.05rem",
              color: "var(--ink-muted)",
            }}
          >
            {initials}
          </div>
        )}
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.01em" }}>
            {company.name}
          </div>
          {company.name_en && (
            <div style={{ fontSize: "0.6rem", color: "var(--ink-muted)", marginTop: "2px" }}>{company.name_en}</div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderTop: "1px solid var(--border)",
          paddingTop: "8px",
          minWidth: 0,
        }}
      >
        {brandAccent && (
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: brandAccent,
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontSize: "0.58rem",
            color: "var(--ink-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {company.email || "—"}
        </span>
      </div>
    </div>
  );
}
