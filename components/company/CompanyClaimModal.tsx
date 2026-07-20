"use client";

import React, { useState, useEffect } from "react";
import type { Company } from "@/types";

interface CompanyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export default function CompanyClaimModal({
  isOpen,
  onClose,
  userEmail = "",
  userName = "",
}: CompanyClaimModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  // Form states
  const [applicantName, setApplicantName] = useState(userName);
  const [applicantEmail, setApplicantEmail] = useState(userEmail);
  const [applicantPhone, setApplicantPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("대표");
  const [proofText, setProofText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (userName) setApplicantName(userName);
    if (userEmail) setApplicantEmail(userEmail);
  }, [userName, userEmail]);

  // Search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/companies/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSearchResults(data.companies || []);
          } else {
            setSearchResults([]);
          }
          setSearching(false);
        })
        .catch(() => {
          setSearchResults([]);
          setSearching(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      setMessage({ text: "대표 권한을 신청할 단체를 먼저 선택해 주세요.", isError: true });
      return;
    }
    if (!applicantName.trim() || !applicantEmail.trim()) {
      setMessage({ text: "신청자 이름과 이메일은 필수 입력 항목입니다.", isError: true });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/companies/claim-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          applicantName,
          applicantEmail,
          applicantPhone,
          roleTitle,
          proofText,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setMessage({ text: data.error || "신청에 실패했습니다.", isError: true });
        setSubmitting(false);
        return;
      }

      setMessage({ text: data.message || "대표 권한 신청이 성공적으로 제출되었습니다.", isError: false });
      setTimeout(() => {
        onClose();
        setSelectedCompany(null);
        setSearchQuery("");
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      setMessage({ text: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.", isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        backgroundColor: "rgba(23, 20, 17, 0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeInScale 0.2s ease-out",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FAF9F5",
          }}
        >
          <div>
            <span
              className="mono"
              style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              ORGANIZATION CLAIM
            </span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--navy)", margin: "2px 0 0" }}>
              단체 연결 / 대표 권한 신청
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.5rem",
              fontWeight: 300,
              cursor: "pointer",
              color: "var(--ink-muted)",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px", overflowY: "auto" }}>
          
          {/* Step 1: Company Search */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
              1. 등록된 단체 검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedCompany) setSelectedCompany(null);
              }}
              placeholder="연결을 신청할 단체 이름을 입력하세요... (예: 공원, 안은미컴퍼니)"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.88rem",
                borderRadius: "6px",
                border: "1.5px solid var(--border)",
                backgroundColor: "#FFFFFF",
              }}
            />

            {/* Search Results dropdown list */}
            {searching && (
              <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "8px" }}>
                🔍 검색 중...
              </div>
            )}

            {!searching && searchQuery.trim().length > 0 && searchResults.length === 0 && !selectedCompany && (
              <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "8px", padding: "10px", background: "#FAF9F5", borderRadius: "6px" }}>
                검색 조건과 일치하는 단체를 찾을 수 없습니다. 단체명을 정확히 확인해 주세요.
              </div>
            )}

            {!searching && searchResults.length > 0 && !selectedCompany && (
              <div
                style={{
                  marginTop: "8px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  border: "1.5px solid var(--navy)",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                }}
              >
                {searchResults.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => {
                      setSelectedCompany(comp);
                      setSearchResults([]);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--border-light)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background 0.15s ease",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#FAF9F5"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#FFFFFF"}
                  >
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 850, color: "var(--navy)" }}>
                        {comp.name} {comp.name_en ? `(${comp.name_en})` : ""}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {comp.genre || "무용/다원예술"}
                      </div>
                    </div>
                    {comp.owner_id ? (
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#C2410C", background: "#FFF7ED", padding: "4px 8px", borderRadius: "4px", border: "1px solid #FFEDD5" }}>
                        대표 연결됨 (덮어쓰기 신청)
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#047857", background: "#ECFDF5", padding: "4px 8px", borderRadius: "4px", border: "1px solid #A7F3D0" }}>
                        선택하기 →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selected Company Card */}
            {selectedCompany && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 16px",
                  background: "#FAF9F5",
                  border: "1.5px solid var(--navy)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span className="mono" style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase" }}>
                    SELECTED ORGANIZATION
                  </span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--navy)" }}>
                    {selectedCompany.name} {selectedCompany.name_en ? `(${selectedCompany.name_en})` : ""}
                  </div>
                  {selectedCompany.owner_id && (
                    <div style={{ fontSize: "0.72rem", color: "#C2410C", fontWeight: 700, marginTop: "2px" }}>
                      ⚠️ 이미 연결된 대표가 있습니다. 관리자 확인 후 덮어쓰기 승인됩니다.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "var(--ink-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  변경
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Representative Information */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                신청자 성함 *
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="홍길동"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                  연락처 이메일 *
                </label>
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="artist@popok.kr"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                  직함 / 역할
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="대표 / 예술감독 / 단장"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                전화번호 (선택)
              </label>
              <input
                type="tel"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="010-0000-0000"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                대표자 확인 증빙 / 메모
              </label>
              <textarea
                rows={3}
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="공식 웹사이트, SNS 관리자 계정, 또는 사업자 등록 정보 등 관리자가 대표자임을 확인할 수 있는 비고/메모를 적어주세요."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  resize: "vertical",
                }}
              />
            </div>

            {message && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  backgroundColor: message.isError ? "#FEF2F2" : "#ECFDF5",
                  color: message.isError ? "#991B1B" : "#065F46",
                  border: `1px solid ${message.isError ? "#FCA5A5" : "#6EE7B7"}`,
                }}
              >
                {message.text}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--ink-muted)",
                  background: "#FFFFFF",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCompany}
                style={{
                  padding: "10px 22px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  backgroundColor: "var(--navy)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: submitting || !selectedCompany ? "not-allowed" : "pointer",
                  opacity: submitting || !selectedCompany ? 0.6 : 1,
                }}
              >
                {submitting ? "신청 중..." : "대표 권한 신청 제출 →"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
