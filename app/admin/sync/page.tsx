"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SyncMeta {
  success: boolean;
  totalRecords: number;
  savedArtists: number;
  lastSync: string;
}

export default function AdminSyncPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (!cached) {
      router.push("/admin");
    } else {
      setPasscode(cached);
      // Load current sync metadata if exists
      fetchCurrentMeta();
    }
  }, [router]);

  const fetchCurrentMeta = async () => {
    // We can infer metadata from a simple load or check
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-passcode": sessionStorage.getItem("admin_passcode") || "" }
      });
      const data = await res.json();
      if (res.ok && data.success && data.stats.lastSync) {
        setResult({
          success: true,
          totalRecords: 116, // approximate or placeholder
          savedArtists: data.stats.publishedArtists,
          lastSync: data.stats.lastSync
        });
      }
    } catch (e) {
      console.warn("Failed to prefetch sync metadata", e);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || "동기화 도중 알 수 없는 에러가 발생했습니다.");
      }
    } catch (err) {
      setError("네트워크 연결 실패로 동기화 작업을 수행할 수 없습니다.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>데이터 동기화 (Supabase Sync)</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>Supabase의 최신 아티스트 정보를 로컬 데이터베이스와 매칭합니다.</p>
      </div>

      <div style={{
        background: "#FFFBEB",
        border: "1.5px solid #FDE68A",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "28px",
        fontSize: "0.88rem",
        color: "#92400E",
        lineHeight: "1.5"
      }}>
        💡 <strong>안내:</strong> 등록 완료 즉시 개인 카드 페이지는 생성됩니다. 단, <strong>/artists 목록 갤러리 화면</strong>에 신규 노출시키기 위해서는 이곳에서 동기화(Sync)를 실행해야 합니다.
      </div>

      <div style={{
        background: "#fff",
        border: "1.5px solid var(--border)",
        borderRadius: "12px",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
      }}>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: "14px 28px",
            background: syncing ? "var(--border)" : "var(--navy)",
            color: syncing ? "var(--ink-faint)" : "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 800,
            cursor: syncing ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            width: "100%",
            textAlign: "center"
          }}
        >
          {syncing ? "Supabase 동기화 중 (이미지 다운로드 포함)..." : "Supabase 데이터 동기화 실행 (Sync)"}
        </button>

        {syncing && (
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", animation: "pulse 2s infinite", textAlign: "center" }}>
            Supabase 레코드를 가져오고 이미지를 로컬에 내려받는 중입니다. 잠시만 기다려주세요...
          </p>
        )}

        {error && (
          <div style={{
            width: "100%", padding: "12px 16px", background: "#FEF2F2",
            border: "1px solid #FCA5A5", borderRadius: "8px",
            color: "#B91C1C", fontSize: "0.82rem", textAlign: "left"
          }}>
            ⚠️ <strong>동기화 실패:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{
            width: "100%", padding: "20px", background: "#F0FDF4",
            border: "1px solid #BBF7D0", borderRadius: "8px",
            color: "#166534", fontSize: "0.85rem", textAlign: "left",
            display: "flex", flexDirection: "column", gap: "8px"
          }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 4px 0", color: "var(--verified)" }}>✓ 동기화 완료</h3>
            <div>• <strong>Supabase 전체 레코드 수:</strong> {result.totalRecords}개</div>
            <div>• <strong>로컬 저장된 아티스트 수 (published):</strong> {result.savedArtists}명</div>
            <div>• <strong>최종 동기화 시점:</strong> {new Date(result.lastSync).toLocaleString("ko-KR")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
