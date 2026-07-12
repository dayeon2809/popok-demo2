"use client";

export type BillingCycle = "monthly" | "annual";

interface PremiumPlanCardProps {
  name: string;
  tagline?: string;
  price: number;
  originalPrice?: number;
  billingCycle: BillingCycle;
  badge?: string;
  highlight?: boolean;
  features: string[];
  ctaLabel: string;
  onSubscribe: () => void;
}

export default function PremiumPlanCard({
  name,
  tagline,
  price,
  originalPrice,
  billingCycle,
  badge,
  highlight,
  features,
  ctaLabel,
  onSubscribe,
}: PremiumPlanCardProps) {
  const isFree = price === 0;
  const unit = billingCycle === "monthly" ? "월" : "년";
  const showOriginalPrice = !isFree && !!originalPrice && originalPrice > price;

  return (
    <div
      className="card"
      style={{
        background: "#FFFFFF",
        border: highlight ? "2px solid var(--navy)" : "1px solid var(--border)",
        borderRadius: "20px",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        position: "relative",
        boxShadow: highlight ? "0 16px 40px rgba(23, 20, 17, 0.1)" : "0 4px 16px rgba(23, 20, 17, 0.03)",
      }}
    >
      {highlight && (
        <span
          className="mono"
          style={{
            position: "absolute",
            top: "-12px",
            left: "28px",
            background: "var(--navy)",
            color: "#FFFFFF",
            padding: "4px 14px",
            borderRadius: "20px",
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.05em",
          }}
        >
          가장 많이 찾는 플랜
        </span>
      )}

      {/* Header */}
      <div>
        <h3 className="display" style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "-0.02em" }}>
          {name}
        </h3>
        {tagline && (
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "4px", lineHeight: 1.5 }}>
            {tagline}
          </p>
        )}
      </div>

      {/* Price */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
          {showOriginalPrice && (
            <span style={{ fontSize: "1.1rem", color: "var(--ink-faint)", fontWeight: 700, textDecoration: "line-through" }}>
              {originalPrice!.toLocaleString()}원
            </span>
          )}
          <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "-0.03em" }}>
            {isFree ? "0원" : `${price.toLocaleString()}원`}
          </span>
          {!isFree && (
            <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: 700 }}>
              / {unit}
            </span>
          )}
        </div>
        {badge && !isFree && (
          <span
            className="tag"
            style={{ marginTop: "10px", display: "inline-block", background: "var(--accent)", color: "var(--navy)", border: "none" }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Features */}
      <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", flexGrow: 1 }}>
        {features.map((feature, idx) => (
          <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.86rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            <span aria-hidden="true" style={{ color: "var(--accent-dark)", fontWeight: 900, flexShrink: 0, marginTop: "1px" }}>
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={onSubscribe}
        className={highlight ? "btn-lime" : "btn-outline"}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          fontSize: "0.9rem",
          fontWeight: 800,
          cursor: "pointer",
          border: highlight ? "none" : undefined,
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
