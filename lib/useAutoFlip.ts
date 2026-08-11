"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_INTERVAL = 4000;
const DEFAULT_PAUSE_AFTER_MANUAL = 6000;

/**
 * Drives a PopokCard/DigitalCard's controlled `flipped`/`onFlipChange` props
 * with a periodic auto-flip: starts on a randomized delay (so multiple cards
 * on the same screen don't all flip in lockstep) and pauses for a few
 * seconds after the viewer manually flips the card, so the timer doesn't
 * immediately fight a deliberate click. Respects prefers-reduced-motion.
 */
export function useAutoFlip(options: { interval?: number; pauseAfterManual?: number } = {}) {
  const { interval: intervalMs = DEFAULT_INTERVAL, pauseAfterManual = DEFAULT_PAUSE_AFTER_MANUAL } = options;
  const [flipped, setFlipped] = useState(false);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const startDelay = Math.random() * intervalMs;
    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        if (!pausedRef.current) setFlipped((prev) => !prev);
      }, intervalMs);
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFlipChange = (next: boolean) => {
    setFlipped(next);
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, pauseAfterManual);
  };

  return { flipped, onFlipChange };
}
