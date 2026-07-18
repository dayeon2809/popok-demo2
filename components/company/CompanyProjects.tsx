"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyProjectsProps {
  company: Company;
}

export default function CompanyProjects({ company }: CompanyProjectsProps) {
  const brandAccent = company.brand_color || "#171411";

  const projectList = (Array.isArray(company.projects) ? company.projects : []) as Array<{ title: string; date?: string; link?: string; description?: string }>;
  if (projectList.length === 0) return null;

  return (
    <section
      style={{
        padding: "50px 0",
        borderBottom: "1px solid var(--border)",
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
          border-radius: 4px;
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
