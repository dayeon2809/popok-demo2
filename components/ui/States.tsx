// components/ui/States.tsx
// 로딩, 에러, 빈 결과 공용 UI

export function LoadingSpinner({ message = "불러오는 중..." }: { message?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--ink-muted)" }}>
      <div style={{
        width: "36px", height: "36px", margin: "0 auto 16px",
        border: "3px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: "0.88rem", fontWeight: 500 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "72px 20px", color: "var(--ink-muted)",
    }}>
      <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>⚠️</div>
      <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>
        데이터를 불러오지 못했습니다.
      </p>
      <p style={{ fontSize: "0.84rem", color: "var(--ink-muted)", marginBottom: "20px" }}>
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "8px 20px", background: "var(--navy)", color: "#fff",
          border: "none", borderRadius: "8px", fontSize: "0.85rem",
          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        다시 시도
      </button>
    </div>
  );
}

export function EmptyState({ message = "결과가 없습니다." }: { message?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--ink-muted)" }}>
      <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>🔍</div>
      <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: "6px" }}>
        {message}
      </p>
      <p style={{ fontSize: "0.84rem" }}>다른 검색어나 필터를 시도해보세요.</p>
    </div>
  );
}
