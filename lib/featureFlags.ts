// Single control point for frontend-only feature toggles. No backend/DB
// state behind these — they only decide what's rendered.
//
// SHOW_PREMIUM_UI: the V2 upload-first experience (feature/home-feed-v2)
// hides premium/pricing UI from the signup->upload flow while every user
// gets full access. Stripe was never connected (MyPopokClient's `isPremium`
// is hardcoded `false` already) and admin/premium logic itself is untouched
// — this flag only hides the *teaser* UI (nav link, "Coming Soon" box), it
// does not touch /premium, /about's premium sections, or any billing code.
export const SHOW_PREMIUM_UI = false;
