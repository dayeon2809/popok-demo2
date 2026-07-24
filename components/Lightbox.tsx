"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

// Minimal full-screen multi-image viewer. No precedent existed in this repo
// (WorkDrawer/artist bottom-sheet are single-item, no paging) — built fresh,
// matching the visual conventions used everywhere else (rgba(23,20,17,..)
// backdrop + blur, framer-motion fade/scale, Escape-to-close).
export default function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  useMobileBodyScrollLock();


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (images.length <= 1) return;
      if (e.key === "ArrowLeft") setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      if (e.key === "ArrowRight") setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(23, 20, 17, 0.9)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        style={{
          position: "absolute",
          top: "16px",
          right: "20px",
          background: "none",
          border: "none",
          color: "#FFFFFF",
          fontSize: "2rem",
          fontWeight: 300,
          lineHeight: 1,
          cursor: "pointer",
          padding: "8px",
        }}
      >
        ×
      </button>

      <div
        style={{ position: "relative", maxWidth: "1100px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={images[index]}
            alt={`이미지 ${index + 1}`}
            initial={{ opacity: 0.4, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ maxWidth: "100%", maxHeight: "82vh", objectFit: "contain", borderRadius: "4px" }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              aria-label="이전 이미지"
              style={{
                position: "absolute",
                left: "-8px",
                top: "50%",
                transform: "translate(-100%, -50%)",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#FFFFFF",
                fontSize: "1.4rem",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              aria-label="다음 이미지"
              style={{
                position: "absolute",
                right: "-8px",
                top: "50%",
                transform: "translate(100%, -50%)",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#FFFFFF",
                fontSize: "1.4rem",
                cursor: "pointer",
              }}
            >
              ›
            </button>
            <div
              className="mono"
              style={{
                position: "absolute",
                bottom: "-36px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
