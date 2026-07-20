"use client";

import React, { useState } from "react";
import Lightbox from "@/components/Lightbox";

interface RepresentativeGalleryProps {
  images: string[] | null | undefined;
}

export default function RepresentativeGallery({ images }: RepresentativeGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const list = (Array.isArray(images) ? images : [])
    .map((img: any) => (typeof img === "string" ? img.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);

  if (list.length === 0) return null;

  return (
    <section style={{ padding: "0 0 40px 0", borderBottom: "1px solid var(--border)", marginBottom: "40px" }}>
      <style jsx global>{`
        .representative-gallery-grid {
          display: grid;
          gap: 10px;
          width: 100%;
        }
        .representative-gallery-grid[data-count="1"] {
          grid-template-columns: 1fr;
        }
        .representative-gallery-grid[data-count="1"] .representative-gallery-item {
          aspect-ratio: 2.4 / 1;
        }
        .representative-gallery-grid[data-count="2"] {
          grid-template-columns: 1fr 1fr;
        }
        .representative-gallery-grid[data-count="2"] .representative-gallery-item {
          aspect-ratio: 1.15 / 1;
        }
        .representative-gallery-grid[data-count="3"] {
          grid-template-columns: 2fr 1fr;
          grid-template-rows: 1fr 1fr;
        }
        .representative-gallery-grid[data-count="3"] .representative-gallery-item:nth-child(1) {
          grid-row: span 2;
          aspect-ratio: unset;
          height: 100%;
        }
        .representative-gallery-grid[data-count="3"] .representative-gallery-item:nth-child(2),
        .representative-gallery-grid[data-count="3"] .representative-gallery-item:nth-child(3) {
          aspect-ratio: 1.6 / 1;
        }
        .representative-gallery-item {
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: #FAF9F5;
          cursor: pointer;
          display: block;
          width: 100%;
          padding: 0;
        }
        .representative-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .representative-gallery-item:hover img {
          transform: scale(1.02);
        }

        @media (max-width: 768px) {
          .representative-gallery-grid {
            display: flex !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 10px;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
          }
          .representative-gallery-grid .representative-gallery-item {
            flex: 0 0 85%;
            scroll-snap-align: start;
            aspect-ratio: 1.3 / 1 !important;
            height: auto !important;
          }
        }
      `}</style>

      <div className="representative-gallery-grid" data-count={String(list.length)}>
        {list.map((src, idx) => (
          <button
            key={idx}
            type="button"
            className="representative-gallery-item"
            onClick={() => setLightboxIndex(idx)}
            aria-label={`대표 이미지 ${idx + 1} 크게 보기`}
          >
            <img src={src} alt={`대표 이미지 ${idx + 1}`} loading={idx === 0 ? "eager" : "lazy"} />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={list}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
