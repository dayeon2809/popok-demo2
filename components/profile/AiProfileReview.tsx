"use client";

import { useState } from "react";
import type { ParsedProfile } from "@/lib/profileParser";

interface AiProfileReviewProps {
  initialDraft: ParsedProfile;
  onConfirm: (finalDraft: ParsedProfile) => void;
  onCancel: () => void;
}

export default function AiProfileReview({ initialDraft, onConfirm, onCancel }: AiProfileReviewProps) {
  // State for basic profile info
  const [name, setName] = useState(initialDraft.artist.name || "");
  const [nameEn, setNameEn] = useState(initialDraft.artist.name_en || "");
  const [genre, setGenre] = useState(initialDraft.artist.genre || "");
  const [role, setRole] = useState(initialDraft.artist.role || "");
  const [bioShort, setBioShort] = useState(initialDraft.artist.bio_short || "");
  const [bio, setBio] = useState(initialDraft.artist.bio || "");

  // AI returned an empty string when it found no grounded facts to work from — show a notice instead of pretending nothing happened.
  const bioShortMissing = !(initialDraft.artist.bio_short || "").trim();
  const bioMissing = !(initialDraft.artist.bio || "").trim();

  // State for arrays
  const [affiliations, setAffiliations] = useState(initialDraft.affiliations || []);
  const [currentActivity, setCurrentActivity] = useState(initialDraft.current_activity || []);
  const [awards, setAwards] = useState(initialDraft.awards || []);
  const [competitions, setCompetitions] = useState(initialDraft.competitions || []);
  const [education, setEducation] = useState(initialDraft.education || []);
  const [links, setLinks] = useState(initialDraft.links || []);

  // State for works (with selection check boxes for representative works, capped at 3)
  const [works, setWorks] = useState(
    (initialDraft.works || []).map((w, idx) => ({
      ...w,
      selected: idx < 3 // default select first 3 works
    }))
  );

  const selectedWorksCount = works.filter((w) => w.selected).length;

  const handleToggleWorkSelection = (index: number) => {
    const updated = [...works];
    const item = updated[index];

    if (!item.selected && selectedWorksCount >= 3) {
      // Prevent selecting more than 3
      return;
    }

    item.selected = !item.selected;
    setWorks(updated);
  };

  // Form helpers
  const handleAddAffiliation = () => {
    setAffiliations([...affiliations, { name: "", position: "" }]);
  };

  const handleRemoveAffiliation = (index: number) => {
    setAffiliations(affiliations.filter((_, idx) => idx !== index));
  };

  const handleAffiliationChange = (index: number, field: string, val: string) => {
    const updated = [...affiliations];
    updated[index] = { ...updated[index], [field]: val };
    setAffiliations(updated);
  };

  const handleAddActivity = () => {
    setCurrentActivity([...currentActivity, ""]);
  };

  const handleRemoveActivity = (index: number) => {
    setCurrentActivity(currentActivity.filter((_, idx) => idx !== index));
  };

  const handleActivityChange = (index: number, val: string) => {
    const updated = [...currentActivity];
    updated[index] = val;
    setCurrentActivity(updated);
  };

  const handleAddAward = () => {
    setAwards([...awards, { year: "", title: "", organization: "", result: "" }]);
  };

  const handleRemoveAward = (index: number) => {
    setAwards(awards.filter((_, idx) => idx !== index));
  };

  const handleAwardChange = (index: number, field: string, val: string) => {
    const updated = [...awards];
    updated[index] = { ...updated[index], [field]: val };
    setAwards(updated);
  };

  const handleAddCompetition = () => {
    setCompetitions([...competitions, { year: "", title: "", organization: "", result: "" }]);
  };

  const handleRemoveCompetition = (index: number) => {
    setCompetitions(competitions.filter((_, idx) => idx !== index));
  };

  const handleCompetitionChange = (index: number, field: string, val: string) => {
    const updated = [...competitions];
    updated[index] = { ...updated[index], [field]: val };
    setCompetitions(updated);
  };

  const handleAddEducation = () => {
    setEducation([...education, ""]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, idx) => idx !== index));
  };

  const handleEducationChange = (index: number, val: string) => {
    const updated = [...education];
    updated[index] = val;
    setEducation(updated);
  };

  const handleAddLink = () => {
    setLinks([...links, { label: "", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, idx) => idx !== index));
  };

  const handleLinkChange = (index: number, field: string, val: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: val };
    setLinks(updated);
  };

  const handleAddWorkItem = () => {
    setWorks([...works, { title: "", year: "", role: "", description: "", image_url: "", video_url: "", selected: selectedWorksCount < 3 }]);
  };

  const handleRemoveWorkItem = (index: number) => {
    setWorks(works.filter((_, idx) => idx !== index));
  };

  const handleWorkItemChange = (index: number, field: string, val: string) => {
    const updated = [...works];
    updated[index] = { ...updated[index], [field]: val };
    setWorks(updated);
  };

  // Compile final profile on submit
  const handleConfirmReview = () => {
    // Only save works that were selected
    const confirmedWorks = works
      .filter((w) => w.selected)
      .map(({ selected, ...item }) => item);

    const finalDraft: ParsedProfile = {
      artist: {
        name: name.trim(),
        name_en: nameEn.trim() || "",
        genre: genre.trim(),
        role: role.trim(),
        bio_short: bioShort.trim() || "",
        bio: bio.trim() || "",
      },
      affiliations: affiliations.filter((a) => a.name.trim()),
      current_activity: currentActivity.filter((act) => act.trim()),
      works: confirmedWorks,
      awards: awards.filter((aw) => aw.title.trim()),
      competitions: competitions.filter((comp) => comp.title.trim()),
      education: education.filter((edu) => edu.trim()),
      links: links.filter((l) => l.url.trim()),
    };

    onConfirm(finalDraft);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "1.5px solid var(--border)",
    borderRadius: "10px",
    outline: "none",
    background: "#FAF8F5",
    color: "var(--navy)"
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "0.78rem",
    fontWeight: 800,
    color: "var(--navy)",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: 900,
    color: "var(--navy)",
    borderBottom: "1.5px solid var(--border)",
    paddingBottom: "8px",
    marginBottom: "16px",
    marginTop: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const badgeBtnStyle: React.CSSProperties = {
    background: "var(--navy)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "0.65rem",
    fontWeight: 800,
    cursor: "pointer"
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Title */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{
          fontSize: "1.45rem",
          fontWeight: 950,
          color: "var(--navy)",
          margin: "0 0 6px",
          letterSpacing: "-0.03em"
        }}>
          AI 프로필 초안 검토
        </h2>
        <p style={{
          fontSize: "0.85rem",
          color: "var(--ink-muted)",
          fontWeight: 600,
          margin: 0
        }}>
          AI가 정리한 초안입니다. 잘못된 정보는 직접 수정하거나 추가/삭제한 뒤 적용해주세요.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* 1. Basic Profile */}
        <div style={sectionHeaderStyle}>기본 정보</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2col">
          <label style={labelStyle}>
            활동명 (Name) *
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            영문명 (English Name)
            <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} style={inputStyle} />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2col">
          <label style={labelStyle}>
            주 활동 분야 (Genre) *
            <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            주 역할 (Role) *
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} />
          </label>
        </div>
        <label style={labelStyle}>
          한줄 소개 (Short Bio)
          <input type="text" value={bioShort} onChange={(e) => setBioShort(e.target.value)} style={inputStyle} />
          {bioShortMissing && (
            <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 600, fontStyle: "italic" }}>
              이력서에서 소개문을 작성할 충분한 내용을 찾지 못했어요. 직접 입력해 주세요.
            </span>
          )}
        </label>
        <label style={labelStyle}>
          상세 소개 (Full Bio)
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" } as any}
          />
          {bioMissing && (
            <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 600, fontStyle: "italic" }}>
              이력서에서 소개문을 작성할 충분한 내용을 찾지 못했어요. 직접 입력해 주세요.
            </span>
          )}
        </label>

        {/* 2. Affiliations */}
        <div style={sectionHeaderStyle}>
          소속 (Affiliations)
          <button onClick={handleAddAffiliation} style={badgeBtnStyle}>+ 추가</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {affiliations.map((aff, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "center" }} className="form-row-2col">
              <input
                type="text"
                placeholder="단체/기관명"
                value={aff.name}
                onChange={(e) => handleAffiliationChange(idx, "name", e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="역할/직책 (예: 단원, 레지던트)"
                value={aff.position || ""}
                onChange={(e) => handleAffiliationChange(idx, "position", e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={() => handleRemoveAffiliation(idx)}
                style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 800, cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>
          ))}
          {affiliations.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>등록된 소속 정보가 없습니다.</span>}
        </div>

        {/* 3. Works (Enforces max 3 selection for free plans) */}
        <div style={sectionHeaderStyle}>
          대표 작품 (Works)
          <span style={{ fontSize: "0.78rem", color: "var(--accent-dark)", fontWeight: 800 }}>
            선택된 대표작: {selectedWorksCount} / 3
          </span>
        </div>
        
        {/* Work selection guidelines */}
        <div style={{
          fontSize: "0.75rem",
          color: "var(--ink-muted)",
          lineHeight: 1.45,
          background: "#FAF8F5",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "1px solid var(--border)"
        }}>
          💡 <strong>대표작 등록 권장 안내:</strong> 무료 포퐄에는 대표 작품을 최대 3개까지 등록할 수 있어요. 전체 작업 이력을 아카이빙하려면 Premium에서 작품을 무제한으로 관리할 수 있습니다.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {works.map((work, idx) => {
            const isFull = selectedWorksCount >= 3;
            const disabled = !work.selected && isFull;

            return (
              <div
                key={idx}
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "14px",
                  padding: "16px",
                  background: work.selected ? "rgba(200, 238, 82, 0.05)" : "#FFFFFF",
                  borderColor: work.selected ? "var(--accent-dark)" : "var(--border)",
                  position: "relative"
                }}
              >
                {/* Select Checkbox at top right */}
                <div style={{ position: "absolute", top: "16px", right: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={work.selected}
                    disabled={disabled}
                    onChange={() => handleToggleWorkSelection(idx)}
                    style={{ width: "16px", height: "16px", cursor: disabled ? "not-allowed" : "pointer" }}
                  />
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: disabled ? "var(--ink-faint)" : "var(--navy)" }}>
                    대표작 등록
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingRight: "100px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 0.4fr", gap: "12px" }} className="form-row-2col">
                    <input
                      type="text"
                      placeholder="작품명 (Title) *"
                      value={work.title}
                      onChange={(e) => handleWorkItemChange(idx, "title", e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="연도 (Year) *"
                      value={work.year}
                      onChange={(e) => handleWorkItemChange(idx, "year", e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="역할 (Role) (예: 안무 및 출연)"
                    value={work.role}
                    onChange={(e) => handleWorkItemChange(idx, "role", e.target.value)}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="작품 소개 설명"
                    value={work.description}
                    onChange={(e) => handleWorkItemChange(idx, "description", e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" } as any}
                  />
                  {!work.description.trim() && (
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 600, fontStyle: "italic" }}>
                      이력서에서 소개문을 작성할 충분한 내용을 찾지 못했어요. 직접 입력해 주세요.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveWorkItem(idx)}
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "16px",
                    background: "none",
                    border: "none",
                    color: "#DC2626",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.78rem"
                  }}
                >
                  작품 삭제
                </button>
              </div>
            );
          })}

          <button onClick={handleAddWorkItem} className="btn-outline" style={{ padding: "10px 0", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 800 }}>
            + 새 작품 추가
          </button>
        </div>

        {/* Premium Lock Banner for Extra Works */}
        {works.length > 3 && (
          <div style={{
            background: "var(--navy)",
            border: "1.5px solid var(--border-dark)",
            borderRadius: "16px",
            padding: "24px",
            color: "#FFFFFF",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            marginTop: "12px",
            boxShadow: "0 10px 30px rgba(23, 20, 17, 0.15)"
          }}>
            <span style={{ fontSize: "1.4rem" }}>🔒</span>
            <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "var(--accent)" }}>POPOK Premium</div>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", margin: "0 0 4px", lineHeight: 1.4 }}>
              작품을 무제한 등록하고<br />AI 자동 업데이트를 받아보세요.
            </p>
            <a
              href="/premium"
              target="_blank"
              style={{
                background: "var(--accent)",
                color: "var(--navy)",
                textDecoration: "none",
                fontWeight: 850,
                fontSize: "0.75rem",
                padding: "8px 20px",
                borderRadius: "30px",
                boxShadow: "0 4px 12px rgba(200, 238, 82, 0.2)"
              }}
            >
              Premium 알아보기
            </a>
          </div>
        )}

        {/* 4. Current Activities */}
        <div style={sectionHeaderStyle}>
          현재 활동 (Activities)
          <button onClick={handleAddActivity} style={badgeBtnStyle}>+ 추가</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {currentActivity.map((act, idx) => (
            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="현재 활동 내역 (예: OO 무용단 정단원 활동 중)"
                value={act}
                onChange={(e) => handleActivityChange(idx, e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={() => handleRemoveActivity(idx)}
                style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 800, cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>
          ))}
          {currentActivity.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>등록된 활동 정보가 없습니다.</span>}
        </div>

        {/* 5. Awards */}
        <div style={sectionHeaderStyle}>
          수상 경력 (Awards)
          <button onClick={handleAddAward} style={badgeBtnStyle}>+ 추가</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {awards.map((aw, idx) => (
            <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.4fr 1.6fr", gap: "12px" }} className="form-row-2col">
                <input
                  type="text"
                  placeholder="연도"
                  value={aw.year}
                  onChange={(e) => handleAwardChange(idx, "year", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="수상 내용 *"
                  value={aw.title}
                  onChange={(e) => handleAwardChange(idx, "title", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="form-row-2col">
                <input
                  type="text"
                  placeholder="수여 기관"
                  value={aw.organization || ""}
                  onChange={(e) => handleAwardChange(idx, "organization", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="결과 (예: 대상, 1위)"
                  value={aw.result}
                  onChange={(e) => handleAwardChange(idx, "result", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={() => handleRemoveAward(idx)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {awards.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>등록된 수상 이력이 없습니다.</span>}
        </div>

        {/* 6. Competitions */}
        <div style={sectionHeaderStyle}>
          경연 / 공모 (Competitions)
          <button onClick={handleAddCompetition} style={badgeBtnStyle}>+ 추가</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {competitions.map((comp, idx) => (
            <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.4fr 1.6fr", gap: "12px" }} className="form-row-2col">
                <input
                  type="text"
                  placeholder="연도"
                  value={comp.year}
                  onChange={(e) => handleCompetitionChange(idx, "year", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="경연/행사명 *"
                  value={comp.title}
                  onChange={(e) => handleCompetitionChange(idx, "title", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="form-row-2col">
                <input
                  type="text"
                  placeholder="주최 기관"
                  value={comp.organization || ""}
                  onChange={(e) => handleCompetitionChange(idx, "organization", e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="진출 결과 (예: 결선 진출)"
                  value={comp.result}
                  onChange={(e) => handleCompetitionChange(idx, "result", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={() => handleRemoveCompetition(idx)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {competitions.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>등록된 경연 이력이 없습니다.</span>}
        </div>

        {/* 7. Education */}
        <div style={sectionHeaderStyle}>
          학력 (Education)
          <button onClick={handleAddEducation} style={badgeBtnStyle}>+ 추가</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {education.map((edu, idx) => (
            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="학력 (예: OO대학교 현대무용전공 학사 졸업)"
                value={edu}
                onChange={(e) => handleEducationChange(idx, e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={() => handleRemoveEducation(idx)}
                style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 800, cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>
          ))}
          {education.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>등록된 학력 정보가 없습니다.</span>}
        </div>

        {/* 8. Links */}
        <div style={sectionHeaderStyle}>
          웹 링크 (Links)
          <button onClick={handleAddLink} style={badgeBtnStyle}>+ 추가</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {links.map((l, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: "12px", alignItems: "center" }} className="form-row-2col">
              <input
                type="text"
                placeholder="라벨 (예: 인스타그램, 포트폴리오)"
                value={l.label || ""}
                onChange={(e) => handleLinkChange(idx, "label", e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="https://..."
                value={l.url}
                onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={() => handleRemoveLink(idx)}
                style={{ background: "none", border: "none", color: "#DC2626", fontWeight: 800, cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>
          ))}
          {links.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>등록된 링크 정보가 없습니다.</span>}
        </div>

        {/* Action Row */}
        <div style={{ display: "flex", gap: "12px", marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
          <button
            onClick={onCancel}
            className="btn-outline"
            style={{ flex: 1, padding: "14px 0", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 800 }}
          >
            뒤로 가기
          </button>
          <button
            onClick={handleConfirmReview}
            className="btn-lime"
            style={{ flex: 1.2, padding: "14px 0", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 950 }}
          >
            이 내용으로 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
