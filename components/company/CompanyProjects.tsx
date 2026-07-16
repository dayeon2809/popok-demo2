"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyProjectsProps {
  company: Company;
}

export default function CompanyProjects({ company }: CompanyProjectsProps) {
  const brandAccent = company.brand_color || "#171411";

  const projectList = (company.projects && company.projects.length > 0
    ? company.projects
    : [
        {
          title: "다차원 신체 공명 연구소 2026 (Physicality Lab)",
          date: "2026.08.10 - 2026.11.20",
          link: "#",
          description: "신체의 움직임과 소리의 매핑을 통한 인터랙티브 퍼포먼스 실험 연구 프로젝트",
        },
        {
          title: "침묵의 잔상 (Scent of Silence) - 아르코예술극장 대극장 공연",
          date: "2026.09.15 - 2026.09.17",
          link: "#",
          description: "공간의 지각적 깊이를 탐구하는 신작 정기 공연 피지컬 시어터",
        },
      ]) as Array<{ title: string; date?: string; link?: string; description?: string }>;

  return (
    <section
      style={{
        padding: "60px 0",
        borderBottom: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .projects-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        .project-card-layout {
          padding: 24px;
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 4px 16px rgba(23, 20, 17, 0.01);
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .project-card-layout:hover {
          border-color: var(--navy);
          box-shadow: 0 12px 24px rgba(23, 20, 17, 0.06);
          transform: translateY(-4px);
        }
        @media (max-width: 768px) {
          .projects-grid-container {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .project-card-layout {
            padding: 20px !important;
          }
          .project-title {
            font-size: 0.98rem !important;
          }
          .project-desc {
            font-size: 0.78rem !important;
          }
        }
      `}</style>

      <h3
        className="mono"
        style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "var(--navy)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "28px",
        }}
      >
        Current Projects & Shows
      </h3>

      <div className="projects-grid-container">
        {projectList.map((project, idx) => (
          <div
            key={idx}
            className="project-card-layout"
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.62rem",
                    color: brandAccent,
                    letterSpacing: "0.05em",
                  }}
                >
                  PROJECT {idx + 1}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", fontFamily: "monospace" }}>
                  {project.date || "ONGOING"}
                </span>
              </div>

              <h4
                className="project-title"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  margin: "0 0 8px 0",
                  lineHeight: 1.4,
                  letterSpacing: "-0.02em"
                }}
              >
                {project.title}
              </h4>

              <p
                className="project-desc"
                style={{
                  fontSize: "0.82rem",
                  color: "var(--ink-muted)",
                  lineHeight: 1.5,
                  margin: "0 0 16px 0",
                  wordBreak: "keep-all"
                }}
              >
                {project.description}
              </p>
            </div>

            {project.link && (
              <a
                href={project.link}
                style={{
                  alignSelf: "flex-start",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  borderBottom: `1.5px solid ${brandAccent}`,
                  textDecoration: "none",
                  paddingBottom: "2px",
                }}
              >
                More Info →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
