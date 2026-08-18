"use client";
import { useEffect, useState } from "react";

// 이 화면은 (protected) 그룹 안에 있으므로 layout.tsx 의 requireAdmin() 이 먼저 돈다.
// 예전에는 app/admin/opportunities 에 있어서 그 문지기 밖이었고, API 호출에는
// sessionStorage 의 "admin_passcode" 를 헤더로 실었다. 그런데 그 값을 저장하는
// 코드가 어디에도 없어서(관리자 로그인이 쿠키 세션으로 바뀔 때 같이 옮겨지지
// 않았다) 이 화면은 늘 빈 문자열을 보냈고, 결과는 401 이었다 — 아무도 못 쓰는
// 화면이었다는 뜻이다. 이제 관리자 세션 쿠키가 요청에 자동으로 실리므로 헤더가
// 필요 없다.
export default function AdminOpportunitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/opportunities");
    const json = await res.json();
    if (!res.ok) setError(json.error);
    else { setError(""); setItems(json.data ?? []); }
  };

  useEffect(() => { void load(); }, []);

  const patch = async (id: string, changes: Record<string, unknown>) => {
    await fetch(`/api/admin/opportunities/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(changes),
    });
    await load();
  };

  return (
    <section>
      <h1>Opportunity 관리</h1>
      <p>수집 공고는 검수 후 공개하세요. 삭제는 데이터 보존을 위해 숨김 처리됩니다.</p>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <article key={item.id} style={{ background: "white", padding: 16, border: "1px solid #ddd" }}>
            <strong>{item.title}</strong>
            <p>{item.organization} · {item.source} · {item.publication_status}</p>
            <button onClick={() => patch(item.id, { isVerified: true, publicationStatus: "published" })}>검수·공개</button>{" "}
            <button onClick={() => patch(item.id, { publicationStatus: "hidden" })}>숨김</button>{" "}
            <a href={item.application_url || item.source_url} target="_blank" rel="noreferrer">원문 보기</a>
          </article>
        ))}
      </div>
    </section>
  );
}
