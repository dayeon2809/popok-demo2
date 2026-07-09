"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PopokCard from "@/components/PopokCard";

interface Props {
  record: {
    id: number;
    name: string;
    genre: string | null;
    instagram: string | null;
    created_at: string | null;
  };
}

export default function ClientCard({ record }: Props) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(currentUrl);
    triggerToast("Link copied to clipboard!");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const cleanInstagramHandle = (url: string | null) => {
    if (!url) return "@username";
    const cleaned = url.trim();
    if (cleaned.startsWith("@")) return cleaned;
    try {
      const rawPath = cleaned
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "");
      const username = rawPath.split("/")[0].split("?")[0];
      return username ? `@${username}` : `@${record.name}`;
    } catch (e) {
      return `@${record.name}`;
    }
  };

  const getInstagramLink = (url: string | null) => {
    if (!url) return "https://instagram.com";
    const cleaned = url.trim();
    if (cleaned.startsWith("http")) return cleaned;
    // Extract handle if it is starting with @
    if (cleaned.startsWith("@")) {
      return `https://instagram.com/${cleaned.substring(1)}`;
    }
    return `https://instagram.com/${cleaned}`;
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div style={{
      flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 24px", position: "relative"
    }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)",
          background: "var(--navy)", color: "#FFFFFF", padding: "10px 24px", borderRadius: "30px",
          fontSize: "0.85rem", fontWeight: 700, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease"
        }}>
          {toastMsg}
        </div>
      )}

      {/* Main Card visual stage */}
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginBottom: "40px" }}>
        <h2 className="display" style={{ fontSize: "2.2rem", color: "var(--navy)", marginBottom: "8px", fontWeight: 900 }}>
          {record.name}'s POPOK
        </h2>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", fontWeight: 500 }}>
          디지털 명함을 탭하여 앞뒷면을 확인하고 공유해 보세요.
        </p>
      </div>

      {/* Enlarged Popok Card */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "40px" }}>
        <PopokCard
          name={record.name}
          genre={record.genre}
          instagram={record.instagram}
          id={String(record.id)}
          cardUrl={currentUrl}
        />
      </div>

      {/* Sharing & Details action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button 
          onClick={handleShare}
          className="btn-lime"
          style={{
            padding: "14px 28px", borderRadius: "30px", border: "none",
            fontSize: "0.875rem", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <span>🔗</span> Share Link
        </button>

        <a 
          href={getInstagramLink(record.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
          style={{
            padding: "14px 28px", borderRadius: "30px", textDecoration: "none",
            fontSize: "0.875rem", fontWeight: 800,
            display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <span>📸</span> Instagram Profile
        </a>

        <Link 
          href="/"
          className="btn-outline"
          style={{
            padding: "14px 28px", borderRadius: "30px", textDecoration: "none",
            fontSize: "0.875rem", fontWeight: 800,
            display: "flex", alignItems: "center"
          }}
        >
          Back to Home
        </Link>
      </div>

    </div>
  );
}
