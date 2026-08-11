import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { notifyIncompleteOnboarding } from "@/lib/email/notify";
import type { SendPopokEmailResult } from "@/lib/email/types";

export const dynamic = "force-dynamic";

type EmailFailureReason =
  | "EMAIL_CONFIG_MISSING"
  | "DOMAIN_NOT_VERIFIED"
  | "RECIPIENT_RESTRICTED"
  | "INVALID_SENDER"
  | "RESEND_REJECTED"
  | "UNKNOWN";

// Any email address appearing in a Resend error message (e.g. "you can only
// send to your own address (x@y.com)") gets masked before it's logged —
// never log a real address in full, including our own sender/account email.
function maskEmailsInMessage(message: string): string {
  return message.replace(/[^\s()<>]+@[^\s()<>]+/g, (m) => {
    const [local, domain] = m.split("@");
    if (!domain) return "***";
    return `${local.slice(0, 2)}***@${domain}`;
  });
}

// Classifies a failed sendPopokEmail() result into one of a small, safe set
// of reason codes the client can react to — never the raw Resend message
// (which can include constraint-ish wording or the sender's own address).
function classifyEmailFailure(result: SendPopokEmailResult): EmailFailureReason {
  if (result.failureKind === "not_configured") return "EMAIL_CONFIG_MISSING";

  const msg = (result.error || "").toLowerCase();
  if (result.statusCode === 403 && msg.includes("only send testing emails to your own email address")) {
    return "RECIPIENT_RESTRICTED";
  }
  if (msg.includes("verify a domain") || (msg.includes("domain") && msg.includes("not") && msg.includes("verif"))) {
    return "DOMAIN_NOT_VERIFIED";
  }
  if (msg.includes("from") && (msg.includes("invalid") || msg.includes("not a verified"))) {
    return "INVALID_SENDER";
  }
  if (result.errorName || result.failureKind === "provider_error") return "RESEND_REJECTED";
  return "UNKNOWN";
}

// Manual, admin-triggered nudge for accounts with no artists/companies row
// yet (/admin/users' "포퐄 만들기 안내 보내기" button). No cron, no bulk send —
// one click, one user. Everything about the recipient (existence, email,
// artist/company ownership) is re-verified here from userId — the client's
// email/state is never trusted, per the same convention as every other
// /api/admin/** write route in this codebase.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  // Safe runtime config snapshot — booleans and a bare domain only, never
  // the key/address itself. Cheap enough to always log; makes a prod-only
  // misconfiguration (e.g. env var present locally but not on the actual
  // deployment serving the request) visible in Vercel Function Logs without
  // needing a live repro.
  console.log("[onboarding-reminder] config", {
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.POPOK_EMAIL_FROM,
    fromDomain: process.env.POPOK_EMAIL_FROM?.match(/@([^\s>]+)/)?.[1] || null,
    siteUrlConfigured: !!process.env.NEXT_PUBLIC_SITE_URL,
    vercelEnv: process.env.VERCEL_ENV || "unknown",
  });

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ success: false, error: "유효하지 않은 사용자 ID입니다." }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !userData?.user) {
    return NextResponse.json({ success: false, error: "대상 사용자를 찾을 수 없습니다." }, { status: 404 });
  }
  const user = userData.user;

  if (!user.email) {
    return NextResponse.json({ success: false, error: "이 회원은 이메일 주소가 없어 안내 메일을 보낼 수 없습니다." }, { status: 400 });
  }

  const [{ data: artist, error: artistError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from("artists").select("id").eq("owner_id", userId).maybeSingle() as any,
    supabase.from("companies").select("id").eq("owner_id", userId).maybeSingle() as any,
  ]);
  if (artistError) return NextResponse.json({ success: false, error: "아티스트 연결 여부 확인에 실패했습니다." }, { status: 500 });
  if (companyError) return NextResponse.json({ success: false, error: "단체 연결 여부 확인에 실패했습니다." }, { status: 500 });

  if (artist || company) {
    return NextResponse.json({ success: false, error: "이미 포퐄이 생성된 회원입니다." }, { status: 409 });
  }

  const greetingName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    "POPOK 회원";

  const result = await notifyIncompleteOnboarding({ userId, to: user.email, greetingName });

  // A message id is the only real proof Resend accepted the send — success
  // without one (including the "already logged" dedup path returning no
  // id) must never be reported to the client as sent.
  if (!result.success || !result.messageId) {
    const reason = classifyEmailFailure(result);
    // Safe subset only: error name/status/message (message run through
    // maskEmailsInMessage) — never the recipient's email, never the raw
    // Resend/service-role credentials.
    console.error("[onboarding-reminder] resend_failed", {
      hasMessageId: !!result.messageId,
      errorName: result.errorName || null,
      statusCode: result.statusCode || null,
      failureKind: result.failureKind || null,
      message: result.error ? maskEmailsInMessage(result.error) : null,
    });
    return NextResponse.json({ success: false, error: "EMAIL_SEND_FAILED", reason }, { status: 502 });
  }

  console.log("[onboarding-reminder] sent", { hasMessageId: true });
  return NextResponse.json({ success: true, messageId: result.messageId });
}
