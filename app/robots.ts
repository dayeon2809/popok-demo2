import type { MetadataRoute } from "next";

// popok.kr had no robots.txt at all (it returned the 404 page), so every
// crawler — including bulk AI scrapers that fetch full-size images — was
// free to walk the whole site. Blocking everything would have been the
// cheapest fix, but the site ships canonical/hreflang/OpenGraph metadata on
// every public page, so search visibility is clearly intended and is not
// given up here. Search engines stay allowed; only the bulk data-collection
// crawlers are turned away, plus the routes that should never have been
// indexed in the first place.
//
// If the demo is ever taken out of search entirely, replace the rules below
// with a single { userAgent: "*", disallow: "/" }.

// Crawlers that scrape at volume for model training / data resale. None of
// them send referral traffic back, so there is nothing to lose by excluding
// them and a meaningful amount of image egress to save.
const BULK_SCRAPERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "CCBot",
  "Applebot-Extended",
  "Google-Extended",
  "meta-externalagent",
  "FacebookBot",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "Timpibot",
];

// Never useful in search results, and the admin tree must not be advertised.
const PRIVATE_PATHS = ["/admin", "/api/", "/my-popok", "/login", "/signup"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...BULK_SCRAPERS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    host: "https://popok.kr",
  };
}
