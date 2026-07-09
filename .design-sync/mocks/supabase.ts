// Design-sync mock of ../../lib/supabase — swapped in via .design-sync/tsconfig.ds.json
// path override so the DS bundle never depends on the app's real auth/session
// module (today localStorage-only, but its own comments flag a real Supabase
// client as a "future setup" — this mock isolates the bundle from that
// change too). Always simulates an anonymous visitor.
import type { UserProfile } from '@/types';

export function getLoggedInUser(): UserProfile | null {
  return null;
}

export function logout(): void {}
