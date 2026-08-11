"use client";

const USE_CASES = [
  "공연과 공모 지원 시 포트폴리오 제출",
  "단체와 기획자에게 활동 이력 공유",
  "흩어진 작품 사진과 크레딧 정리",
  "새로운 활동을 한 페이지에 계속 업데이트",
];

export default function HomeUseCasesSection() {
  return (
    <section className="home-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "64px 24px",
      borderTop: "1px solid var(--border)",
    }}>
      <h2 className="display" style={{
        fontSize: "clamp(1.6rem, 3.6vw, 2.3rem)",
        color: "var(--navy)",
        fontWeight: 950,
        letterSpacing: "-0.03em",
        margin: "0 0 32px",
        textAlign: "center",
      }}>
        이런 순간에 바로 사용할 수 있어요
      </h2>

      <div className="home-usecases-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        marginBottom: "32px",
      }}>
        {USE_CASES.map((useCase) => (
          <div key={useCase} style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "#FFFFFF", border: "1.5px solid var(--border)",
            borderRadius: "14px", padding: "18px 20px",
          }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "var(--accent-dark)", flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.9rem", color: "var(--navy)", fontWeight: 700, lineHeight: 1.45 }}>
              {useCase}
            </span>
          </div>
        ))}
      </div>

      <p style={{
        textAlign: "center",
        fontSize: "1rem",
        fontWeight: 800,
        color: "var(--navy)",
        letterSpacing: "-0.01em",
        margin: 0,
      }}>
        PDF를 매번 다시 만들 필요 없이, 링크 하나만 보내세요.
      </p>
    </section>
  );
}
