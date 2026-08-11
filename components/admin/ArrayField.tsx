"use client";

import styles from "./ArrayField.module.css";

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--navy)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.02em" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", fontSize: "0.84rem", outline: "none", background: "#FFFFFF", color: "var(--navy)", fontFamily: "inherit" };
const actionBtnStyle: React.CSSProperties = { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "#FFF", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", cursor: "pointer", fontFamily: "inherit" };
const iconBtnStyle: React.CSSProperties = { width: "26px", height: "26px", borderRadius: "6px", border: "1px solid var(--border)", background: "#FFFFFF", fontSize: "0.7rem", fontWeight: 700, color: "var(--navy)", cursor: "pointer", fontFamily: "inherit" };

export { labelStyle, inputStyle };

type ArrayFieldVariant = "default" | "dashboard";

export function ArrayField<T>({ label, items, onChange, newItem, renderItem, addLabel = "+ 항목 추가", variant = "default" }: {
  label: string; items: T[]; onChange: (items: T[]) => void; newItem: () => T;
  renderItem: (item: T, setItem: (next: T) => void) => React.ReactNode;
  addLabel?: string; variant?: ArrayFieldVariant;
}) {
  const dashboard = variant === "dashboard";
  const move = (idx: number, dir: -1 | 1) => { const target = idx + dir; if (target < 0 || target >= items.length) return; const next = [...items]; [next[idx], next[target]] = [next[target], next[idx]]; onChange(next); };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const setAt = (idx: number) => (next: T) => { const arr = [...items]; arr[idx] = next; onChange(arr); };
  const add = () => onChange([...items, newItem()]);

  return <div className={dashboard ? styles.dashboard : undefined}>
    <div className={dashboard ? styles.header : undefined} style={dashboard ? undefined : { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
      <label style={labelStyle}>{label}</label>
      <button type="button" onClick={add} className={dashboard ? styles.addButton : undefined} style={dashboard ? undefined : actionBtnStyle}>{addLabel}</button>
    </div>
    <div className={dashboard ? styles.list : undefined} style={dashboard ? undefined : { display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.length === 0 && <p className={dashboard ? styles.empty : undefined} style={dashboard ? undefined : { fontSize: "0.75rem", color: "var(--ink-muted)", margin: 0 }}>항목이 없습니다.</p>}
      {items.map((item, idx) => <div key={idx} className={dashboard ? styles.row : undefined} style={dashboard ? undefined : { border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", display: "flex", gap: "8px", alignItems: "flex-start", background: "#FAF8F5" }}>
        <div className={dashboard ? styles.fields : undefined} style={dashboard ? undefined : { flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px" }}>{renderItem(item, setAt(idx))}</div>
        <div className={dashboard ? styles.controls : undefined} style={dashboard ? undefined : { display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
          <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} style={dashboard ? undefined : iconBtnStyle} title="위로"><span aria-hidden>↑</span><em>위로</em></button>
          <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} style={dashboard ? undefined : iconBtnStyle} title="아래로"><span aria-hidden>↓</span><em>아래로</em></button>
          <button type="button" onClick={() => remove(idx)} className={dashboard ? styles.remove : undefined} style={dashboard ? undefined : { ...iconBtnStyle, color: "#EF4444", borderColor: "#FEE2E2" }} title="삭제"><span aria-hidden>✕</span><em>삭제</em></button>
        </div>
      </div>)}
    </div>
  </div>;
}

export function StringArrayField({ label, items, onChange, placeholder, variant = "default" }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string; variant?: ArrayFieldVariant }) {
  return <ArrayField<string> label={label} items={items} onChange={onChange} newItem={() => ""} variant={variant} renderItem={(item, setItem) => variant === "dashboard"
    ? <textarea className={styles.textarea} rows={2} placeholder={placeholder} value={item} onChange={(event) => setItem(event.target.value)} />
    : <input style={inputStyle} placeholder={placeholder} value={item} onChange={(event) => setItem(event.target.value)} />
  } />;
}