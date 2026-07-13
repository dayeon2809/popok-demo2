"use client";

import { useState } from "react";
import type { ParsedProfile } from "@/lib/profileParser";

interface AiProfileCompareProps {
  currentProfile: {
    name: string;
    name_en: string;
    genre: string;
    role: string;
    bio_short: string;
    bio: string;
    works: any[];
    affiliations: any[];
    current_activity: string[];
    awards: any[];
    competitions: any[];
    education: string[];
    links: any[];
  };
  parsedProfile: ParsedProfile;
  onConfirm: (merged: any) => void;
  onCancel: () => void;
}

function cleanString(str: any): string {
  if (!str) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
}

export default function AiProfileCompare({ currentProfile, parsedProfile, onConfirm, onCancel }: AiProfileCompareProps) {
  // Compare single fields
  const singleFields = [
    { key: "name", label: "활동명 (Name)" },
    { key: "name_en", label: "영문 활동명 (English Name)" },
    { key: "genre", label: "주 분야 (Genre)" },
    { key: "role", label: "역할 (Role)" },
    { key: "bio_short", label: "한줄 소개 (Short Bio)" },
    { key: "bio", label: "상세 소개 (Full Bio)" },
  ] as const;

  // Track checked fields to accept the AI suggestion
  const [selectedSingles, setSelectedSingles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    singleFields.forEach(({ key }) => {
      const cur = currentProfile[key] || "";
      const parsed = parsedProfile.artist[key] || "";
      // Precheck if current is empty and AI found something new
      if (!cur.trim() && parsed.trim()) {
        initial[key] = true;
      }
    });
    return initial;
  });

  // Helper to check array duplicates
  const compareArrays = (currentArr: any[], parsedArr: any[], type: "works" | "affiliations" | "awards" | "competitions" | "education" | "links") => {
    return parsedArr.map((parsedItem, idx) => {
      let matchIdx = -1;

      if (type === "works") {
        matchIdx = currentArr.findIndex(cur =>
          cleanString(cur.title) === cleanString(parsedItem.title) &&
          cleanString(cur.year) === cleanString(parsedItem.year)
        );
      } else if (type === "awards" || type === "competitions") {
        matchIdx = currentArr.findIndex(cur =>
          cleanString(cur.title) === cleanString(parsedItem.title) &&
          cleanString(cur.year) === cleanString(parsedItem.year)
        );
      } else if (type === "education") {
        matchIdx = currentArr.findIndex(cur => cleanString(cur) === cleanString(parsedItem));
      } else if (type === "affiliations") {
        matchIdx = currentArr.findIndex(cur =>
          cleanString(cur.name) === cleanString(parsedItem.name) &&
          cleanString(cur.position) === cleanString(parsedItem.position)
        );
      } else if (type === "links") {
        matchIdx = currentArr.findIndex(cur => cleanString(cur.url) === cleanString(parsedItem.url));
      }

      if (matchIdx >= 0) {
        // Check if fully identical
        const curItem = currentArr[matchIdx];
        let isIdentical = true;

        if (type === "works") {
          isIdentical = cleanString(curItem.role) === cleanString(parsedItem.role) &&
                        cleanString(curItem.description) === cleanString(parsedItem.description);
        } else if (type === "awards" || type === "competitions" || type === "affiliations") {
          isIdentical = cleanString(curItem.organization) === cleanString(parsedItem.organization) &&
                        cleanString(curItem.result) === cleanString(parsedItem.result);
        } else if (type === "links") {
          isIdentical = cleanString(curItem.label) === cleanString(parsedItem.label);
        }

        return {
          item: parsedItem,
          status: isIdentical ? "identical" : "conflict",
          matchingCurrentIndex: matchIdx,
          defaultChecked: !isIdentical
        };
      }

      return {
        item: parsedItem,
        status: "new",
        matchingCurrentIndex: -1,
        defaultChecked: true
      };
    });
  };

  // State to hold analyzed arrays
  const [worksComp, setWorksComp] = useState(() => compareArrays(currentProfile.works, parsedProfile.works, "works"));
  const [affiliationsComp, setAffiliationsComp] = useState(() => compareArrays(currentProfile.affiliations, parsedProfile.affiliations, "affiliations"));
  const [awardsComp, setAwardsComp] = useState(() => compareArrays(currentProfile.awards, parsedProfile.awards, "awards"));
  const [competitionsComp, setCompetitionsComp] = useState(() => compareArrays(currentProfile.competitions, parsedProfile.competitions, "competitions"));
  const [educationComp, setEducationComp] = useState(() => compareArrays(currentProfile.education, parsedProfile.education, "education"));
  const [linksComp, setLinksComp] = useState(() => compareArrays(currentProfile.links, parsedProfile.links, "links"));

  // Check state arrays
  const [checkedWorks, setCheckedWorks] = useState(() => worksComp.map(w => w.defaultChecked));
  const [checkedAffiliations, setCheckedAffiliations] = useState(() => affiliationsComp.map(a => a.defaultChecked));
  const [checkedAwards, setCheckedAwards] = useState(() => awardsComp.map(a => a.defaultChecked));
  const [checkedCompetitions, setCheckedCompetitions] = useState(() => competitionsComp.map(c => c.defaultChecked));
  const [checkedEducation, setCheckedEducation] = useState(() => educationComp.map(e => e.defaultChecked));
  const [checkedLinks, setCheckedLinks] = useState(() => linksComp.map(l => l.defaultChecked));

  // Perform Merge
  const handleConfirmMerge = () => {
    // 1. Single fields merge
    // Never let a blank AI suggestion overwrite an existing non-empty value.
    const pickSingle = (key: typeof singleFields[number]["key"]) => {
      const parsedVal = parsedProfile.artist[key] || "";
      if (!selectedSingles[key] || !parsedVal.trim()) return currentProfile[key];
      return parsedVal;
    };

    const mergedArtist = {
      name: pickSingle("name"),
      name_en: pickSingle("name_en"),
      genre: pickSingle("genre"),
      role: pickSingle("role"),
      bio_short: pickSingle("bio_short"),
      bio: pickSingle("bio"),
    };

    // 2. Arrays Merge
    // Works merge
    let mergedWorks = [...currentProfile.works];
    worksComp.forEach((comp, idx) => {
      if (checkedWorks[idx]) {
        if (comp.status === "new") {
          mergedWorks.push(comp.item);
        } else if (comp.status === "conflict" && comp.matchingCurrentIndex >= 0) {
          // Replace matching item with AI suggestion, but never blank out an existing description
          const existing = currentProfile.works[comp.matchingCurrentIndex];
          mergedWorks[comp.matchingCurrentIndex] = {
            ...comp.item,
            description: comp.item.description?.trim() ? comp.item.description : existing?.description || "",
          };
        }
      }
    });

    // Affiliations merge
    let mergedAffiliations = [...currentProfile.affiliations];
    affiliationsComp.forEach((comp, idx) => {
      if (checkedAffiliations[idx]) {
        if (comp.status === "new") {
          mergedAffiliations.push(comp.item);
        } else if (comp.status === "conflict" && comp.matchingCurrentIndex >= 0) {
          mergedAffiliations[comp.matchingCurrentIndex] = comp.item;
        }
      }
    });

    // Awards merge
    let mergedAwards = [...currentProfile.awards];
    awardsComp.forEach((comp, idx) => {
      if (checkedAwards[idx]) {
        if (comp.status === "new") {
          mergedAwards.push(comp.item);
        } else if (comp.status === "conflict" && comp.matchingCurrentIndex >= 0) {
          mergedAwards[comp.matchingCurrentIndex] = comp.item;
        }
      }
    });

    // Competitions merge
    let mergedCompetitions = [...currentProfile.competitions];
    competitionsComp.forEach((comp, idx) => {
      if (checkedCompetitions[idx]) {
        if (comp.status === "new") {
          mergedCompetitions.push(comp.item);
        } else if (comp.status === "conflict" && comp.matchingCurrentIndex >= 0) {
          mergedCompetitions[comp.matchingCurrentIndex] = comp.item;
        }
      }
    });

    // Education merge
    let mergedEducation = [...currentProfile.education];
    educationComp.forEach((comp, idx) => {
      if (checkedEducation[idx] && comp.status === "new") {
        mergedEducation.push(comp.item);
      }
    });

    // Links merge
    let mergedLinks = [...currentProfile.links];
    linksComp.forEach((comp, idx) => {
      if (checkedLinks[idx]) {
        if (comp.status === "new") {
          mergedLinks.push(comp.item);
        } else if (comp.status === "conflict" && comp.matchingCurrentIndex >= 0) {
          mergedLinks[comp.matchingCurrentIndex] = comp.item;
        }
      }
    });

    onConfirm({
      artist: mergedArtist,
      works: mergedWorks,
      affiliations: mergedAffiliations,
      awards: mergedAwards,
      competitions: mergedCompetitions,
      education: mergedEducation,
      links: mergedLinks,
    });
  };

  const getStatusBadge = (status: "new" | "conflict" | "identical" | "no-suggestion") => {
    switch (status) {
      case "new":
        return <span style={{ background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 800 }}>새 항목</span>;
      case "conflict":
        return <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "2px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 800 }}>수정 제안</span>;
      case "identical":
        return <span style={{ background: "#FAF8F5", color: "var(--ink-muted)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700 }}>동일</span>;
      case "no-suggestion":
        return <span style={{ background: "#FAF8F5", color: "var(--ink-muted)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700 }}>AI 제안 없음</span>;
    }
  };

  return (
    <div style={{ width: "100%", paddingBottom: "20px" }}>
      {/* Title */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 950, color: "var(--navy)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
          AI 프로필 업데이트 비교
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: 600, margin: 0 }}>
          기존 데이터와 AI 분석 결과를 비교했습니다. 가져오고 싶은 변경 항목을 선택하여 병합하세요.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Single Fields Table */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--navy)", borderBottom: "1.5px solid var(--border)", paddingBottom: "8px", marginBottom: "16px" }}>
            기본 정보 비교
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {singleFields.map(({ key, label }) => {
              const cur = currentProfile[key] || "";
              const parsed = parsedProfile.artist[key] || "";
              const isIdentical = cleanString(cur) === cleanString(parsed);

              if (isIdentical && !parsed.trim()) return null; // hide empty identical fields

              let status: "new" | "conflict" | "identical" | "no-suggestion" = "identical";
              if (isIdentical) status = "identical";
              else if (!parsed.trim()) status = "no-suggestion"; // AI found nothing — never treat as an overwrite candidate
              else if (!cur.trim()) status = "new";
              else status = "conflict";

              return (
                <div
                  key={key}
                  style={{
                    border: "1.5px solid var(--border)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    background: status === "identical" ? "#FAF8F5" : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "var(--navy)" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {getStatusBadge(status)}
                      {status !== "identical" && status !== "no-suggestion" && (
                        <input
                          type="checkbox"
                          checked={selectedSingles[key] || false}
                          onChange={(e) => setSelectedSingles({ ...selectedSingles, [key]: e.target.checked })}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      )}
                    </div>
                  </div>

                  {status === "no-suggestion" ? (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", fontStyle: "italic" }}>
                      이력서에서 소개문을 작성할 충분한 내용을 찾지 못했어요. 기존 값을 유지합니다.
                    </div>
                  ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.8rem" }}>
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)", fontWeight: 700, marginBottom: "4px" }}>현재 값:</div>
                      <div style={{ color: "var(--navy)", minHeight: "18px", wordBreak: "break-all" }}>{cur || "(비어 있음)"}</div>
                    </div>
                    <div style={{ borderLeft: "1.5px solid var(--border)", paddingLeft: "14px" }}>
                      <div style={{ fontSize: "0.68rem", color: "var(--accent-dark)", fontWeight: 800, marginBottom: "4px" }}>AI 제안 값:</div>
                      <div style={{ color: "var(--navy)", fontWeight: status !== "identical" ? 750 : "normal", wordBreak: "break-all" }}>
                        {parsed || "(비어 있음)"}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrays comparison rendering */}
        {/* Helper function to render array comparison section */}
        {renderArraySection(
          "대표 작품 비교 (Works)",
          worksComp,
          checkedWorks,
          setCheckedWorks,
          (item) => `${item.title} (${item.year}) - ${item.role || "역할 없음"}\n${item.description || ""}`
        )}

        {renderArraySection(
          "학력 비교 (Education)",
          educationComp,
          checkedEducation,
          setCheckedEducation,
          (item) => String(item)
        )}

        {renderArraySection(
          "소속 단체 비교 (Affiliations)",
          affiliationsComp,
          checkedAffiliations,
          setCheckedAffiliations,
          (item) => `${item.name} (${item.position || "소속원"})`
        )}

        {renderArraySection(
          "수상 비교 (Awards)",
          awardsComp,
          checkedAwards,
          setCheckedAwards,
          (item) => `${item.year}년 - ${item.title} (${item.organization || ""})`
        )}

        {renderArraySection(
          "경연 / 공모 비교 (Competitions)",
          competitionsComp,
          checkedCompetitions,
          setCheckedCompetitions,
          (item) => `${item.year}년 - ${item.title} (${item.organization || ""})`
        )}

        {renderArraySection(
          "외부 링크 비교 (Links)",
          linksComp,
          checkedLinks,
          setCheckedLinks,
          (item) => `${item.label || "링크"}: ${item.url}`
        )}

        {/* Bottom Actions */}
        <div style={{ display: "flex", gap: "12px", marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
          <button
            onClick={onCancel}
            className="btn-outline"
            style={{ flex: 1, padding: "14px 0", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 800 }}
          >
            취소
          </button>
          <button
            onClick={handleConfirmMerge}
            className="btn-lime"
            style={{ flex: 1.2, padding: "14px 0", borderRadius: "30px", fontSize: "0.85rem", fontWeight: 950 }}
          >
            선택한 항목 병합하기
          </button>
        </div>

      </div>
    </div>
  );
}

function renderArraySection(
  title: string,
  compList: any[],
  checkedList: boolean[],
  setCheckedList: (list: boolean[]) => void,
  renderText: (item: any) => string
) {
  if (compList.length === 0) return null;

  const handleToggle = (idx: number) => {
    const next = [...checkedList];
    next[idx] = !next[idx];
    setCheckedList(next);
  };

  return (
    <div>
      <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--navy)", borderBottom: "1.5px solid var(--border)", paddingBottom: "8px", marginBottom: "16px", marginTop: "16px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {compList.map((comp, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "12px 14px",
              background: comp.status === "identical" ? "#FAF8F5" : "transparent"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingRight: "40px" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--navy)", fontWeight: 700, whiteSpace: "pre-line" }}>
                {renderText(comp.item)}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {getStatusBadge(comp.status)}
              {comp.status !== "identical" && (
                <input
                  type="checkbox"
                  checked={checkedList[idx]}
                  onChange={() => handleToggle(idx)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusBadge(status: "new" | "conflict" | "identical") {
  switch (status) {
    case "new":
      return <span style={{ background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: "20px", fontSize: "0.62rem", fontWeight: 800 }}>새 항목</span>;
    case "conflict":
      return <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "2px 8px", borderRadius: "20px", fontSize: "0.62rem", fontWeight: 800 }}>수정 제안</span>;
    case "identical":
      return <span style={{ background: "#FAF8F5", color: "var(--ink-muted)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.62rem", fontWeight: 700 }}>동일</span>;
  }
}
