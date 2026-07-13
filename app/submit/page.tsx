import { redirect } from "next/navigation";

// The old standalone submission form has been replaced by the /onboarding flow.
// Kept as a redirect (not deleted) so existing links/bookmarks to /submit still work.
export default function SubmitPage() {
  redirect("/onboarding");
}
