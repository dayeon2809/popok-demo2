/**
 * lib/api.ts — 클라이언트용 훅
 * /api/* 엔드포인트를 호출. API Key는 여기 없음 (서버 라우트에서만 사용).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Artist, Work, ArtistWithWorks, ArtistFilter, Performance } from "@/types";

async function apiFetch<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  const res  = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) return { data: null, error: json.error ?? "알 수 없는 오류" };
  return json;
}

function buildArtistsUrl(filter: ArtistFilter): string {
  const params = new URLSearchParams();
  if (filter.query?.trim())              params.set("query", filter.query.trim());
  if (filter.type  && filter.type  !== "all") params.set("type",  filter.type);
  if (filter.field && filter.field !== "all") params.set("field", filter.field);
  const qs = params.toString();
  return `/api/artists${qs ? "?" + qs : ""}`;
}

// ── useArtists ────────────────────────────────────────────────────
export function useArtists(filter: ArtistFilter = {}) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchArtists = useCallback(async (f: ArtistFilter) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiFetch<Artist[]>(buildArtistsUrl(f));
    setArtists(data ?? []);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    // query는 300ms debounce, type/field는 즉시
    const delay = filter.query !== undefined ? 300 : 0;
    timer.current = setTimeout(() => fetchArtists(filter), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.query, filter.type, filter.field]);

  return { artists, loading, error, refetch: () => fetchArtists(filter) };
}

// ── useArtist (단건 — recordId 또는 fields.id 모두 동작) ──────────
export function useArtist(id: string) {
  const [artist,  setArtist]  = useState<ArtistWithWorks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setArtist(null);
    setError(null);
    apiFetch<ArtistWithWorks>(`/api/artists/${encodeURIComponent(id)}`).then(
      ({ data, error: err }) => {
        if (cancelled) return;
        setArtist(data);
        setError(err);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [id]);

  return { artist, loading, error };
}

// ── useWorks ─────────────────────────────────────────────────────
export function useWorks(artistId?: string) {
  const [works,   setWorks]   = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = artistId
      ? `/api/works?artist_id=${encodeURIComponent(artistId)}`
      : "/api/works";
    apiFetch<Work[]>(url).then(({ data, error: err }) => {
      if (cancelled) return;
      setWorks(data ?? []);
      setError(err);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [artistId]);

  return { works, loading, error };
}

// ── usePerformances ────────────────────────────────────────────────
export function usePerformances() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformances = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await apiFetch<Performance[]>("/api/performances");
    setPerformances(data ?? []);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  return { performances, loading, error, refetch: fetchPerformances };
}

// ── usePerformance ─────────────────────────────────────────────────
export function usePerformance(id: string) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setPerformance(null);
    setError(null);
    apiFetch<Performance>(`/api/performances/${encodeURIComponent(id)}`).then(
      ({ data, error: err }) => {
        if (cancelled) return;
        setPerformance(data);
        setError(err);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, [id]);

  return { performance, loading, error };
}
