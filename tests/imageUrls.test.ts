import test from "node:test";
import assert from "node:assert/strict";
import { getListImageUrl, getNextImageUrl, isSupabasePublicImageUrl } from "../lib/imageUrls.ts";

const supabase = "https://project.supabase.co/storage/v1/object/public/artist-media/a.jpg";

test("recognizes public Supabase Storage URLs", () => {
  assert.equal(isSupabasePublicImageUrl(supabase), true);
  assert.equal(isSupabasePublicImageUrl("https://images.example.com/a.jpg"), false);
});

test("list image URLs are capped at 600px and quality 80", () => {
  assert.equal(
    getListImageUrl(supabase, 1200),
    `/api/image?url=${encodeURIComponent(supabase)}&w=600&q=80`
  );
});

test("small requested widths use the next allowed cached variant", () => {
  assert.match(getNextImageUrl(supabase, 90, 80, 600), /&w=96&q=80$/);
});

test("external and local URLs remain unchanged", () => {
  assert.equal(getListImageUrl("https://images.example.com/a.jpg"), "https://images.example.com/a.jpg");
  assert.equal(getListImageUrl("/images/local.jpg"), "/images/local.jpg");
});

// The cases below are the exact shapes the call sites feed this helper after
// d7c31c8 wired it into every public surface. /api/image answers 403 for any
// host that is not our Storage bucket, so a helper that "helpfully" rewrote
// one of these would turn a working image into a broken one — a visible
// regression that typechecking cannot catch. Verified against a live dev
// server: the three rejected shapes below really do return 403 when sent to
// the proxy, and the Supabase one really does return image/webp.

test("fallback sources that the proxy would reject are passed through untouched", () => {
  // components/RelatedArtists, app/artists/ArtistsClient and company/DigitalCard
  // all fall back to a generated avatar when there is no uploaded photo.
  const dicebear = "https://api.dicebear.com/7.x/shapes/svg?seed=%EA%B9%80";
  assert.equal(getListImageUrl(dicebear, 600), dicebear);

  // home/ContentCarousel, home/InstagramStoryCard, company/CompanyInstagramPosts
  const instagram = "https://scontent.cdninstagram.com/v/t51.29350-15/abc.jpg";
  assert.equal(getListImageUrl(instagram, 600), instagram);

  // Signed URLs are a different Storage path (/object/sign/) and are not public.
  const signed = "https://project.supabase.co/storage/v1/object/sign/artist-media/a.jpg?token=x";
  assert.equal(getListImageUrl(signed, 600), signed);
});

test("empty and missing sources do not become proxy requests", () => {
  // company/CompanyHero and CompanyBrochureHeader use `a || b || ""` inside a
  // truthiness guard; if that guard is ever dropped the helper must still not
  // manufacture a request for an empty string.
  assert.equal(getListImageUrl("", 128), "");
  assert.equal(getListImageUrl(undefined as unknown as string, 128), undefined);
  assert.equal(getListImageUrl(null as unknown as string, 128), null);
});

test("an already-proxied URL is not wrapped a second time", () => {
  // Guards against a component being converted twice, or a proxied URL being
  // stored and fed back in. The encoded form contains no literal
  // "/storage/v1/object/public/", so this holds — pin it so it keeps holding.
  const once = getListImageUrl(supabase, 600);
  assert.equal(getListImageUrl(once, 600), once);
  assert.equal((once.match(/\/api\/image/g) || []).length, 1);
});

test("every width the call sites pass maps onto a cached variant", () => {
  // Each distinct width is a separate origin fetch and a separate CDN entry,
  // so the call sites deliberately reuse this small set rather than passing
  // arbitrary CSS pixel sizes.
  for (const width of [32, 48, 64, 96, 128, 256, 384, 600]) {
    assert.match(
      getListImageUrl(supabase, width),
      new RegExp(`&w=${width}&q=80$`),
      `width ${width} should map to itself, not round up to a larger variant`
    );
  }
  // Anything larger is clamped rather than honoured, so one oversized call
  // cannot pull a full-resolution render through the proxy.
  assert.match(getListImageUrl(supabase, 4000), /&w=600&q=80$/);
});