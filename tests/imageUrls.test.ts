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