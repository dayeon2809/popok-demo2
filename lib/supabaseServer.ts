import { createClient } from "@supabase/supabase-js";

let _supabaseServer: ReturnType<typeof createClient> | null = null;

export function getSupabaseServer() {
  if (!_supabaseServer) {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase Server credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing in environment.");
    }

    _supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return _supabaseServer;
}
