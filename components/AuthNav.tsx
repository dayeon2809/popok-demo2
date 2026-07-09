"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/useLanguage";

export default function AuthNav() {
  const { language } = useLanguage();
  const t = {
    myPopok: language === "ko" ? "내 포퐄 확인하기" : "My POPOK",
    cta: language === "ko" ? "내 포퐄 만들기" : "Get my POPOK",
  };

  return (
    <div className="auth-nav" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <Link href="/my-popok" style={{
        textDecoration: "none", fontSize: "0.875rem", fontWeight: 700,
        color: "var(--navy)",
      }}>
        {t.myPopok}
      </Link>
      <Link href="/submit" style={{
        textDecoration: "none", fontSize: "0.875rem", fontWeight: 800,
        padding: "10px 20px", borderRadius: "10px",
        display: "inline-flex", alignItems: "center",
      }} className="btn-lime">
        {t.cta}
      </Link>
    </div>
  );
}
