import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import robots from "../app/robots.ts";

// Why this test exists
// -------------------
// In August 2026 the Supabase org blew past its free egress quota (16.41 GB
// against a 5.5 GB limit) and was three days from having the live demo cut
// off. The cause was not traffic — it was that public pages handed browsers
// the *original* Storage images: 835 KB on average, 5.54 MB at the largest,
// scaled down with CSS at the last moment.
//
// The fix was already half-built. `/api/image` (a sharp resize + WebP proxy,
// added 2026-08-02) turns a 5.54 MB original into 11.9 KB and serves it from
// Vercel's CDN, so Supabase is hit once instead of once per visitor. It was
// simply not wired into most components. `lib/imageUrls.ts` is the seam:
// getListImageUrl()/getNextImageUrl() rewrite a Supabase public URL into an
// /api/image request.
//
// So the rule this test enforces is: a public page must never put a raw
// Supabase URL into <img src>. That is easy to reintroduce by accident —
// every one of the 18 offenders was written by someone following the
// surrounding code — and impossible to notice until a bill arrives. Hence a
// budget test rather than a review checklist.

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components"];

// The admin tree is behind a login and gets a handful of internal pageviews a
// month, so its egress is noise. Everything else is fair game.
const SKIPPED_TREES = ["app/admin"];

// Files still allowed to render a raw <img src={...}>, with the count they are
// allowed and why. Anything not listed here — or listed but over budget — is a
// failure. Shrinking a number is always safe; raising one needs a reason as
// good as the ones below.
const ALLOWED: Record<string, { max: number; reason: string }> = {
  // The proxy wrapper itself — it is what produces the optimized URL.
  "components/ResponsiveImage.tsx": { max: 1, reason: "next/image wrapper; builds the /api/image URL" },

  // Not Supabase-hosted, so the proxy would refuse them anyway (/api/image
  // only accepts its own Storage hostname).
  "components/home/ContentCarousel.tsx": { max: 1, reason: "Instagram CDN URL" },
  "components/home/InstagramStoryCard.tsx": { max: 1, reason: "Instagram CDN URL" },
  "components/company/CompanyInstagramPosts.tsx": { max: 1, reason: "Instagram CDN URL" },
  "components/MotionProfile.tsx": { max: 1, reason: "YouTube poster thumbnail" },

  // Locally bundled or generated in the browser — no network fetch at all.
  "components/CompanyBigCard.tsx": { max: 1, reason: "local placeholder asset" },
  "components/PopokCard.tsx": { max: 1, reason: "QR code data URL" },
  "components/company/DigitalCard.tsx": { max: 1, reason: "QR code data URL" },
  "components/artist/ArtistStoryShareModal.tsx": { max: 1, reason: "object URL preview, pre-upload" },
  "components/my-popok/QuickUploadPanel.tsx": { max: 1, reason: "object URL preview, pre-upload" },
  "app/organizations/apply/OrganizationApplyClient.tsx": { max: 1, reason: "object URL preview, pre-upload" },

  // Behind a login. Real Supabase images, but seen by one signed-in user at a
  // time rather than by every visitor, so they are not what moves the bill.
  // Worth converting eventually; not worth the regression risk right now.
  "app/my-popok/messages/MessageListClient.tsx": { max: 1, reason: "signed-in only" },
  "app/my-popok/messages/[conversationId]/ConversationClient.tsx": { max: 1, reason: "signed-in only" },
  "components/messages/PopokChatPreviewPanel.tsx": { max: 1, reason: "signed-in only" },
  "components/portfolio-requests/ReceivedPortfolioRequests.tsx": { max: 1, reason: "signed-in only" },
  "components/portfolio-requests/SentPortfolioRequests.tsx": { max: 1, reason: "signed-in only" },
  "components/portfolio-requests/SendPortfolioModal.tsx": { max: 2, reason: "signed-in only" },
  "components/company/CompanyCmsEditor.tsx": { max: 5, reason: "signed-in company editor" },
};

function collectTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (SKIPPED_TREES.some((tree) => rel === tree || rel.startsWith(`${tree}/`))) continue;
    if (statSync(full).isDirectory()) collectTsxFiles(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

// Splitting on "/>" rather than matching <img ...> with a regex is deliberate:
// JSX attributes routinely contain ">" inside arrow functions (onError={() =>
// ...}), which makes the obvious [^>]* pattern stop in the wrong place.
function countRawImages(source: string): number {
  let count = 0;
  for (const chunk of source.split("<img").slice(1)) {
    const attrs = chunk.split("/>")[0];
    const hasDynamicSrc = /src=\{/.test(attrs);
    const usesProxy = /getListImageUrl|getNextImageUrl/.test(attrs);
    if (hasDynamicSrc && !usesProxy) count += 1;
  }
  return count;
}

test("public pages route Supabase images through the resize proxy", () => {
  const files = SCAN_DIRS.flatMap((dir) => collectTsxFiles(join(ROOT, dir)));
  assert.ok(files.length > 50, "scan found suspiciously few .tsx files — is cwd the repo root?");

  const unexpected: string[] = [];
  const overBudget: string[] = [];

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const count = countRawImages(readFileSync(file, "utf8"));
    if (count === 0) continue;

    const allowance = ALLOWED[rel];
    if (!allowance) {
      unexpected.push(`${rel} (${count})`);
    } else if (count > allowance.max) {
      overBudget.push(`${rel}: ${count} > ${allowance.max} allowed (${allowance.reason})`);
    }
  }

  assert.deepEqual(
    unexpected,
    [],
    "These files pass a raw URL to <img src>. Wrap it in getListImageUrl(src, width) " +
      "from lib/imageUrls, or add it to ALLOWED in this file with a reason:\n  " +
      unexpected.join("\n  ")
  );
  assert.deepEqual(overBudget, [], `Raw <img> count grew:\n  ${overBudget.join("\n  ")}`);
});

test("allowlist has no stale entries", () => {
  // A file that was fixed but left in ALLOWED would silently re-open the door
  // for that file later, so the budget has to shrink as the code improves.
  const stale: string[] = [];
  for (const [rel, allowance] of Object.entries(ALLOWED)) {
    const count = countRawImages(readFileSync(join(ROOT, rel), "utf8"));
    if (count < allowance.max) stale.push(`${rel}: allows ${allowance.max}, only ${count} left`);
  }
  assert.deepEqual(stale, [], `Lower these entries in ALLOWED:\n  ${stale.join("\n  ")}`);
});

test("robots.txt blocks bulk scrapers but keeps search engines", () => {
  const rules = robots().rules as Array<{ userAgent: string; allow?: string | string[]; disallow?: string | string[] }>;

  const wildcard = rules.find((rule) => rule.userAgent === "*");
  assert.ok(wildcard, "there must be a catch-all rule so search engines are not blocked by omission");
  assert.ok((wildcard!.allow as string[]).includes("/"), "the site itself must stay crawlable");
  assert.ok(
    (wildcard!.disallow as string[]).includes("/admin"),
    "the admin tree must not be advertised to crawlers"
  );

  // /api/ is disallowed, but /api/image serves every photograph on the site
  // now that the proxy is wired in everywhere. Without the narrower Allow,
  // Googlebot renders the pages with all images missing.
  assert.ok(
    (wildcard!.allow as string[]).includes("/api/image"),
    "/api/image must stay fetchable or crawlers render the site without images"
  );

  for (const agent of ["GPTBot", "ClaudeBot", "Bytespider", "CCBot"]) {
    const rule = rules.find((r) => r.userAgent === agent);
    assert.ok(rule, `${agent} should have its own rule`);
    assert.equal(rule!.disallow, "/", `${agent} should be disallowed everywhere`);
  }

  // Guard against the blunt fix — blocking everyone — being reintroduced by
  // accident. The site ships canonical/hreflang/OpenGraph metadata on every
  // public page, so search visibility is intended.
  for (const agent of ["Googlebot", "Yeti", "bingbot"]) {
    const rule = rules.find((r) => r.userAgent === agent);
    assert.equal(rule, undefined, `${agent} should fall under the catch-all allow, not be singled out`);
  }
});
