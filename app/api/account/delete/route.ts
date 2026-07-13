import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Deletes the caller's own account. The session is verified via the cookie-based
// SSR client (so a caller can only ever delete themselves); the service-role client
// is only ever used server-side here, never sent to the browser.
export async function POST() {
  const sessionClient = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  try {
    // Detach + unpublish the linked artist profile rather than hard-deleting it,
    // consistent with this project's "prefer unpublish over delete" convention for
    // owned artist rows.
    const { error: artistError } = await (supabase.from("artists") as any)
      .update({ owner_id: null, status: "draft" })
      .eq("owner_id", user.id);

    if (artistError) {
      console.error("[POST /api/account/delete] Artist detach error:", artistError);
      return NextResponse.json({ success: false, error: "프로필 처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("[POST /api/account/delete] Profile delete error:", profileError);
      return NextResponse.json({ success: false, error: "프로필 삭제 중 오류가 발생했습니다." }, { status: 500 });
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.error("[POST /api/account/delete] Auth user delete error:", authDeleteError);
      return NextResponse.json({ success: false, error: "계정 삭제 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/account/delete] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
