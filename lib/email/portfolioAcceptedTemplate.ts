import { getSiteUrl } from "./client";
import { escapeHtml, type EmailContent } from "./templates";

export function buildPortfolioRequestAcceptedEmail(params: {
  recipientName: string;
  acceptedByName: string;
  conversationId?: string | null;
}): EmailContent {
  const siteUrl = getSiteUrl();
  const recipientName = escapeHtml(params.recipientName);
  const acceptedByName = escapeHtml(params.acceptedByName);
  const ctaLabel = params.conversationId ? "포퐄챗 시작하기" : "내 포퐄 확인하기";
  const ctaUrl = params.conversationId
    ? `${siteUrl}/my-popok/messages/${encodeURIComponent(params.conversationId)}`
    : `${siteUrl}/my-popok`;
  const subject = "[POPOK] 포퐄 요청이 수락되었어요";
  const html = `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#FAF9F5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #E5E1D8;border-radius:12px;">
<tr><td style="padding:36px 32px 16px;font-size:20px;font-weight:900;color:#171411;">POPOK</td></tr>
<tr><td style="padding:0 32px 8px;color:#171411;font-size:15px;line-height:1.7;">
<p>안녕하세요, ${recipientName} 님.</p>
<p>${acceptedByName} 님이 포퐄 요청을 수락했습니다.<br>이제 POPOK에서 1:1 대화를 시작할 수 있어요.</p>
</td></tr>
<tr><td style="padding:8px 32px 36px;"><a href="${ctaUrl}" style="display:inline-block;background:#171411;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">${ctaLabel}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `안녕하세요, ${params.recipientName} 님.`,
    `${params.acceptedByName} 님이 포퐄 요청을 수락했습니다.`,
    "이제 POPOK에서 1:1 대화를 시작할 수 있어요.",
    `${ctaLabel}: ${ctaUrl}`,
  ].join("\n");
  return { subject, html, text };
}
