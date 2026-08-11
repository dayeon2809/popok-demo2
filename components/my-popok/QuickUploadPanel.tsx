"use client";

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB — reasonable technical cap, not a premium gate
const ACCEPTED_TYPE_PREFIX = "image/";

interface QuickUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface QuickUploadPanelProps {
  /** Uploads one file to Supabase Storage (reuses MyPopokClient's existing uploadImageFile) and returns its public URL, or null on failure. */
  uploadFile: (file: File) => Promise<string | null>;
  /** Called once per successfully uploaded file. The caller stores it in a temporary image inbox, not as a work. */
  onUploaded: (url: string, file: File) => void;
  disabled?: boolean;
}

// Mass image upload for the V2 "사진만 올리세요" dashboard entry point
// (feature/home-feed-v2). Multiple files at once (drag-and-drop or the
// native multi-select file picker — both already support this without any
// backend change), per-file preview + progress + individual retry. No new
// upload API — every file goes through the existing single-file
// uploadImageFile()/`/api/upload` the rest of the profile editor already
// uses; this component just orchestrates calling it once per file.
export default function QuickUploadPanel({ uploadFile, onUploaded, disabled }: QuickUploadPanelProps) {
  const [items, setItems] = useState<QuickUploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (item: QuickUploadItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", error: undefined } : i)));
    const url = await uploadFile(item.file);
    if (url) {
      onUploaded(url, item.file);
      URL.revokeObjectURL(item.previewUrl);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: "업로드 실패" } : i)));
    }
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith(ACCEPTED_TYPE_PREFIX));
    const oversized = files.some((f) => f.size > MAX_FILE_SIZE);
    const accepted = files.filter((f) => f.size <= MAX_FILE_SIZE);

    if (oversized) {
      alert("15MB를 초과하는 파일은 제외되었습니다.");
    }
    if (accepted.length === 0) return;

    const newItems: QuickUploadItem[] = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));

    setItems((prev) => [...prev, ...newItems]);
    // Sequential (not parallel) so /api/upload — a single-file endpoint —
    // isn't hit with a burst of concurrent requests, and so the "최근 업로드"
    // preview strip fills in the same order the user picked.
    (async () => {
      for (const item of newItems) {
        await processFile(item);
      }
    })();
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const retryItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) processFile(item);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          // Priority card (V2 upload-first dashboard) — lime accent at rest,
          // not just on drag-over, so it visually leads the resume card next
          // to it. Sizing (minHeight/padding/border/radius/icon/text sizes)
          // is kept identical to the resume card in MyPopokClient.tsx on purpose.
          border: `2px dashed ${dragOver ? "var(--navy)" : "var(--accent-dark)"}`,
          borderRadius: "16px",
          minHeight: "200px",
          padding: "32px 20px",
          textAlign: "center",
          background: dragOver ? "var(--accent)" : "var(--accent-light)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px",
        }}
      >
        <div style={{ fontSize: "1.6rem", marginBottom: "4px" }}>📸</div>
        <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}>
          작업 사진을 여러 장 올려보세요
        </p>
        <p style={{ fontSize: "0.76rem", color: "var(--ink-muted)", margin: 0 }}>
          클릭하거나 파일을 이곳에 드래그하세요 · 공연 사진, 리허설, 포스터, 스틸컷 모두 좋아요
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>

      {items.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: "10px", marginTop: "16px",
        }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: "relative", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", background: "#EAE6DD" }}>
              <img src={item.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {item.status === "uploading" && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(23,20,17,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: "0.7rem", fontWeight: 700,
                }}>
                  업로드 중...
                </div>
              )}
              {item.status === "done" && (
                <div style={{
                  position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", borderRadius: "50%",
                  background: "var(--accent)", color: "var(--navy)", fontSize: "0.7rem", fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  ✓
                </div>
              )}
              {item.status === "error" && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(180,40,40,0.75)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px",
                }}>
                  <span style={{ color: "#FFFFFF", fontSize: "0.65rem", fontWeight: 700 }}>실패</span>
                  <button
                    type="button"
                    onClick={() => retryItem(item.id)}
                    style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--navy)", background: "#FFFFFF", border: "none", borderRadius: "6px", padding: "3px 8px", cursor: "pointer" }}
                  >
                    재시도
                  </button>
                </div>
              )}
              {item.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="제거"
                  style={{
                    position: "absolute", top: "4px", left: "4px", width: "20px", height: "20px", borderRadius: "50%",
                    background: "rgba(23,20,17,0.65)", color: "#FFFFFF", border: "none", fontSize: "0.7rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
