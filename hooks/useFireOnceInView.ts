"use client";

import { useCallback, useRef } from "react";

/**
 * Returns a callback ref that fires `callback` at most once, the first time
 * the element it's attached to scrolls into view. A callback ref (rather
 * than a plain ref + useEffect) is required here because the target element
 * often doesn't exist yet on first mount (e.g. it's behind a loading state)
 * — a plain ref's mount-once effect would never retry observing once the
 * real element finally appears, whereas React invokes a callback ref again
 * as soon as the node is actually attached.
 */
export function useFireOnceInView<T extends HTMLElement>(callback: () => void) {
  const firedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((el: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || firedRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          callbackRef.current();
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observerRef.current.observe(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
