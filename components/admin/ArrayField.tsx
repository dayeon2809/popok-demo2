"use client";

// Generic repeating-row editor used by admin screens for JSONB array fields
// (affiliations, works, awards, competitions, links, ... on submissions and
// companies alike). Extracted from app/admin/submissions/page.tsx so
// app/admin/companies/[id]/page.tsx can reuse the same add/remove/reorder
// behavior instead of a bespoke JSON editor.

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--navy)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1.5px solid var(--border)",
  fontSize: "0.84rem",
  outline: "none",
  background: "#FFFFFF",
  color: "var(--navy)",
  fontFamily: "inherit",
};

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "#FFF",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "var(--navy)",
  cursor: "pointer",
  fontFamily: "inherit",
};

const iconBtnStyle: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "#FFFFFF",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--navy)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export { labelStyle, inputStyle };

export function ArrayField<T>({
  label,
  items,
  onChange,
  newItem,
  renderItem,
  addLabel = "+ 항목 추가",
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, setItem: (next: T) => void) => React.ReactNode;
  addLabel?: string;
}) {
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const setAt = (idx: number) => (next: T) => {
    const arr = [...items];
    arr[idx] = next;
    onChange(arr);
  };
  const add = () => onChange([...items, newItem()]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <label style={labelStyle}>{label}</label>
        <button type="button" onClick={add} style={actionBtnStyle}>{addLabel}</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {items.length === 0 && (
          <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", margin: 0 }}>항목이 없습니다.</p>
        )}
        {items.map((item, idx) => (
          <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", display: "flex", gap: "8px", alignItems: "flex-start", background: "#FAF8F5" }}>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              {renderItem(item, setAt(idx))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} style={iconBtnStyle} title="위로">↑</button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} style={iconBtnStyle} title="아래로">↓</button>
              <button type="button" onClick={() => remove(idx)} style={{ ...iconBtnStyle, color: "#EF4444", borderColor: "#FEE2E2" }} title="삭제">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── String array editor (current_activity / education / warnings) ──────
export function StringArrayField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <ArrayField<string>
      label={label}
      items={items}
      onChange={onChange}
      newItem={() => ""}
      renderItem={(item, setItem) => (
        <input style={inputStyle} placeholder={placeholder} value={item} onChange={(e) => setItem(e.target.value)} />
      )}
    />
  );
}
