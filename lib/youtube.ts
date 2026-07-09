export function extractYouTubeVideoId(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/[()]/g, "");

  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) return cleaned;

  try {
    const url = new URL(cleaned);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch {
    return null;
  }

  return null;
}

export function isYouTubeUrl(input?: string | null) {
  return Boolean(extractYouTubeVideoId(input));
}

export function getYouTubeEmbedUrl({
  videoId,
  start = 0,
  end = 15,
  autoplay = true,
  mute = true,
  controls = false,
  enableJsApi = true,
}: {
  videoId: string;
  start?: number;
  end?: number;
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  enableJsApi?: boolean;
}) {
  const params = new URLSearchParams({
    start: String(start),
    end: String(end),
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    controls: controls ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    iv_load_policy: "3",
  });

  if (enableJsApi) params.set("enablejsapi", "1");

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function getYouTubePreviewAspectRatio(input?: string | null, fallback: "16 / 9" | "9 / 16" = "16 / 9") {
  if (!input) return fallback;
  return input.includes("/shorts/") ? "9 / 16" : fallback;
}
