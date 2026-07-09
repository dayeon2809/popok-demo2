import { AuthNav } from 'poc-app';

// AuthNav manages its own session state internally (reads the design-sync
// mock of lib/supabase, which always simulates an anonymous visitor) — the
// logged-out link is the only state this preview can safely show.
export function Default() {
  return <AuthNav />;
}
