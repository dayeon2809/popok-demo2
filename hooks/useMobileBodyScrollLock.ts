"use client";

import { useEffect } from "react";

let mobileLockCount = 0;
let lockedScrollY = 0;
let previousBodyStyles: Partial<CSSStyleDeclaration> | null = null;

/** Keeps the page fixed at its current position while a mobile overlay is open. */
export function useMobileBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active || !window.matchMedia("(max-width: 768px)").matches) return;

    if (mobileLockCount === 0) {
      lockedScrollY = window.scrollY;
      previousBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      };
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    }
    mobileLockCount += 1;

    return () => {
      mobileLockCount = Math.max(0, mobileLockCount - 1);
      if (mobileLockCount !== 0 || !previousBodyStyles) return;
      document.body.style.position = previousBodyStyles.position || "";
      document.body.style.top = previousBodyStyles.top || "";
      document.body.style.left = previousBodyStyles.left || "";
      document.body.style.right = previousBodyStyles.right || "";
      document.body.style.width = previousBodyStyles.width || "";
      document.body.style.overflow = previousBodyStyles.overflow || "";
      previousBodyStyles = null;
      window.scrollTo({ top: lockedScrollY, left: 0, behavior: "instant" });
    };
  }, [active]);
}