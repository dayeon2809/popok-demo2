"use client";

import { useState, useRef } from "react";

interface AiProfileImporterProps {
  onParsed: (data: any) => void;
  onCancel: () => void;
}

export default function AiProfileImporter({ onParsed, onCancel }: AiProfileImporterProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      const ext = dropped.name.toLowerCase();
      if (ext.endsWith(".pdf") || ext.endsWith(".docx") || ext.endsWith(".txt")) {
        setFile(dropped);
        setErrorMsg("");
      } else {
        setErrorMsg("PDF, DOCX, TXT 파일만 지원됩니다.");
      }
    }
  };

  const startAiParsing = async () => {
    setErrorMsg("");
    setParsing(true);

    try {
      let res: Response;

      if (activeTab === "file") {
        if (!file) {
          setErrorMsg("업로드할 파일을 선택해 주세요.");
          setParsing(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        res = await fetch("/api/profile/parse", {
          method: "POST",
          body: formData,
        });
      } else {
        if (!rawText.trim()) {
          setErrorMsg("분석할 텍스트 내용을 입력해 주세요.");
          setParsing(false);
          return;
        }

        res = await fetch("/api/profile/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText }),
        });
      }

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        onParsed(data.data);
      } else {
        setErrorMsg(data.error || "내용을 자동으로 정리하지 못했어요. 다른 파일을 사용하거나 텍스트를 직접 붙여넣어 주세요.");
      }
    } catch (err: any) {
      setErrorMsg("서버 연결에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Description */}
      <div>
        <h2 style={{
          fontSize: "1.45rem",
          fontWeight: 950,
          color: "var(--navy)",
          margin: "0 0 8px",
          letterSpacing: "-0.03em"
        }}>
          이미 정리해둔 이력이 있나요?
        </h2>
        <p style={{
          fontSize: "0.85rem",
          color: "var(--ink-muted)",
          lineHeight: 1.5,
          fontWeight: 600,
          margin: 0
        }}>
          이력서나 기존 소개글을 넣으면 POPOK AI가 프로필 초안을 정리해드려요. 확인하고 수정한 뒤 사용할 수 있습니다.
        </p>
      </div>

      {parsing ? (
        /* Loader view */
        <div style={{
          padding: "60px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent-dark)",
            animation: "aiLoaderRotate 1s linear infinite"
          }} />
          <p style={{ fontSize: "0.9rem", color: "var(--navy)", fontWeight: 800, margin: 0 }}>
            AI가 이력을 구조화하는 중입니다...
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
            문서 길이에 따라 최대 10초까지 걸릴 수 있습니다.
          </span>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes aiLoaderRotate {
              to { transform: rotate(360deg); }
            }
          `}} />
        </div>
      ) : (
        /* Importer configuration UI */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Tab selector */}
          <div style={{
            display: "flex",
            border: "1.5px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#FAF8F5"
          }}>
            <button
              onClick={() => setActiveTab("file")}
              style={{
                flex: 1,
                padding: "10px 0",
                fontSize: "0.8rem",
                fontWeight: 800,
                border: "none",
                background: activeTab === "file" ? "var(--navy)" : "transparent",
                color: activeTab === "file" ? "#FFFFFF" : "var(--ink-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              파일 업로드 (PDF / DOCX / TXT)
            </button>
            <button
              onClick={() => setActiveTab("text")}
              style={{
                flex: 1,
                padding: "10px 0",
                fontSize: "0.8rem",
                fontWeight: 800,
                border: "none",
                background: activeTab === "text" ? "var(--navy)" : "transparent",
                color: activeTab === "text" ? "#FFFFFF" : "var(--ink-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              텍스트 직접 입력
            </button>
          </div>

          {activeTab === "file" ? (
            /* File Upload tab */
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: "14px",
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "#FAF8F5",
                transition: "border 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                style={{ display: "none" }}
              />
              <span style={{ fontSize: "1.8rem" }}>📄</span>
              <div>
                <p style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", margin: "0 0 4px" }}>
                  {file ? file.name : "이곳에 이력서 파일을 끌어다 놓거나 클릭하여 선택"}
                </p>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                  PDF, DOCX, TXT (최대 10MB)
                </span>
              </div>
            </div>
          ) : (
            /* Text paste tab */
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="예술가로서의 주요 경력, 소속, 작품 활동 등을 여기에 붙여넣어 주세요."
              rows={6}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none"
              }}
            />
          )}

          {/* Privacy Notice Banner */}
          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            gap: "8px",
            fontSize: "0.72rem",
            color: "#B45309",
            lineHeight: 1.45
          }}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <div>
              <strong>개인정보 주의 안내:</strong> 업로드한 내용은 프로필 초안을 생성하는 데만 사용됩니다. 주민등록번호, 주소, 계좌번호 등 불필요한 민감정보는 제거한 뒤 업로드해주세요. 원본 파일은 서버에 저장되지 않습니다.
            </div>
          </div>

          {errorMsg && (
            <div style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "#DC2626",
              background: "#FEF2F2",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1.5px solid #FCA5A5"
            }}>
              {errorMsg}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button
              onClick={onCancel}
              className="btn-outline"
              style={{ flex: 1, padding: "14px 0", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 800 }}
            >
              직접 입력하기
            </button>
            <button
              onClick={startAiParsing}
              className="btn-lime"
              style={{ flex: 1.2, padding: "14px 0", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 900 }}
            >
              AI로 빠르게 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
