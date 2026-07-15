"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — matches API + Storage bucket limit
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  fontSize: "0.95rem",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 800,
  color: "var(--navy)",
  marginBottom: "6px",
};

type FileState = "idle" | "selected" | "uploading" | "success" | "error";

export default function OrganizationApplyClient() {
  const searchParams = useSearchParams();
  // Prefilled from a CONNECTED ORGANIZATION "미등록 단체" card
  // (/organizations/apply?orgName=...) — only changes the initial value,
  // never re-syncs after the user edits the field.
  const orgNameFromQuery = searchParams.get("orgName")?.trim() || "";

  const [orgName, setOrgName] = useState(orgNameFromQuery);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  // Honeypot — left empty by real users, invisible to them. Bots that fill
  // every field on a form tend to fill this too, which the API uses to
  // silently drop the submission.
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileState, setFileState] = useState<FileState>("idle");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validateAndSetFile = (candidate: File | undefined | null) => {
    if (!candidate) return;
    const isPdf = candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("PDF 파일만 업로드할 수 있습니다.");
      setFileState("error");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFileError("파일 크기는 20MB를 초과할 수 없습니다.");
      setFileState("error");
      return;
    }
    setFile(candidate);
    setFileError("");
    setFileState("selected");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setFileState("idle");
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): string | null => {
    if (!orgName.trim()) return "단체명을 입력해 주세요.";
    if (!contactName.trim()) return "대표자명을 입력해 주세요.";
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) return "올바른 이메일 주소를 입력해 주세요.";
    if (!phone.trim()) return "연락처를 입력해 주세요.";
    if (!instagram.trim()) return "인스타그램을 입력해 주세요.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    if (file) setFileState("uploading");

    try {
      const formData = new FormData();
      formData.append("org_name", orgName.trim());
      formData.append("contact_name", contactName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("instagram", instagram.trim());
      if (website.trim()) formData.append("website", website.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("company_website", companyWebsite);
      if (file) formData.append("file", file);

      const res = await fetch("/api/organizations/apply", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (file) setFileState("success");
        setSubmitted(true);
      } else {
        if (file) setFileState("error");
        setErrorMsg(data.error || "신청 접수 중 오류가 발생했습니다. 다시 시도해주세요.");
        setSubmitting(false);
      }
    } catch (err: any) {
      if (file) setFileState("error");
      setErrorMsg("서버 연결에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "75vh", padding: "24px" }}>
        <div className="card fade-up" style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
          background: "#FFFFFF",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(23, 20, 17, 0.04)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px", animation: "float1 4s ease-in-out infinite" }}>🎉</div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
            신청이 완료되었습니다.
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.6 }}>
            POPOK 운영팀에서 확인 후 인터뷰 및 단체 포트폴리오 제작을 위해 연락드리겠습니다.
          </p>
          <Link href="/" style={{
            display: "inline-block",
            textDecoration: "none",
            padding: "14px 28px",
            borderRadius: "12px",
            fontSize: "0.95rem",
            fontWeight: 800,
          }} className="btn-lime">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "75vh", padding: "24px" }}>
      <form onSubmit={handleSubmit} className="card fade-up" style={{
        maxWidth: "560px",
        width: "100%",
        padding: "40px 32px",
        background: "#FFFFFF",
        border: "1.5px solid var(--border)",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(23, 20, 17, 0.04)",
      }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
          단체 포트폴리오 제작 신청
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.6 }}>
          POPOK 운영팀이 인터뷰를 통해 단체 포트폴리오를 함께 구축해드립니다. 아래 정보를 남겨주시면 확인 후 연락드릴게요.
        </p>

        {orgNameFromQuery && (
          <div style={{
            background: "var(--bg-warm)",
            border: "1px dashed var(--border-dark)",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "24px",
            fontSize: "0.85rem",
            color: "var(--navy)",
            lineHeight: 1.6,
          }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              아직 POPOK에 등록되지 않은 단체입니다.
            </p>
            <p style={{ margin: "6px 0 0" }}>
              단체의 작품과 활동을 하나의 포트폴리오로 남겨보세요. 신청이 완료되면 POPOK 팀이 검토 후 공식 단체 페이지를 제작합니다.
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
              단체 관계자이신 경우 등록을 신청해주세요.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={labelStyle}>단체명 *</label>
            <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="예: POPOK 무용단" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>대표자명 *</label>
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="예: 홍길동" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>이메일 *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>연락처 *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>인스타그램 *</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@popok_dance" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>홈페이지 (선택)</label>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>간단한 단체 소개 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="단체의 활동과 특징을 간단히 소개해 주세요."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Honeypot field — hidden from real users via CSS + aria-hidden, not via display:none
             (some bots skip display:none fields), and excluded from tab order. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
            <label htmlFor="org-apply-company-website">웹사이트</label>
            <input
              id="org-apply-company-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>단체 이력서 (PDF, 선택)</label>
            {fileState !== "selected" && fileState !== "uploading" && fileState !== "success" ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "14px",
                  padding: "28px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#FAF8F5",
                  transition: "border 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "1.6rem" }}>📄</span>
                <p style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
                  이곳에 단체 이력서(PDF)를 끌어다 놓거나 클릭하여 선택
                </p>
                <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>PDF 파일만 지원 (최대 20MB)</span>
              </div>
            ) : (
              <div style={{
                border: "1.5px solid var(--border)",
                borderRadius: "14px",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                background: "#FAF8F5",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <span style={{ fontSize: "1.3rem" }}>📄</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px",
                    }}>
                      {file?.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                      {file ? `${(file.size / (1024 * 1024)).toFixed(1)}MB` : ""}
                      {fileState === "uploading" && " · 업로드 및 제출 중..."}
                      {fileState === "success" && " · 업로드 완료"}
                    </div>
                  </div>
                </div>
                {fileState !== "uploading" && (
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      border: "none", background: "none", color: "var(--ink-muted)",
                      fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    제거
                  </button>
                )}
              </div>
            )}
            {fileError && (
              <p style={{ fontSize: "0.76rem", color: "#DC2626", fontWeight: 700, marginTop: "6px" }}>
                {fileError}
              </p>
            )}
          </div>

          {errorMsg && (
            <div style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "#DC2626",
              background: "#FEF2F2",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1.5px solid #FCA5A5",
            }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-lime"
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "12px",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: 800,
              cursor: submitting ? "not-allowed" : "pointer",
              marginTop: "4px",
            }}
          >
            {submitting ? "제출 중..." : "신청서 제출하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
