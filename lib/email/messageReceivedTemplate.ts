import { getSiteUrl } from "./client";
import { escapeHtml, type EmailContent } from "./templates";

export function buildMessageReceivedEmail(params: {
  recipientName: string;
  senderName: string;
  conversationId: string;
}): EmailContent {
  const recipientName = escapeHtml(params.recipientName);
  const senderName = escapeHtml(params.senderName);
  const ctaUrl = `${getSiteUrl()}/my-popok/messages/${encodeURIComponent(params.conversationId)}`;
  const subject = `[POPOK] ${params.senderName}님의 새 포퐄챗 메시지가 도착했습니다`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#FAF9F5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E5E1D8;border-radius:12px;">
          <tr><td style="padding:36px 32px 24px;font-size:20px;font-weight:900;color:#171411;letter-spacing:-0.02em;">POPOK</td></tr>
          <tr><td style="padding:0 32px 8px;color:#171411;font-size:15px;line-height:1.7;">
            <p style="margin:0 0 16px;">안녕하세요, ${recipientName}님.</p>
            <p style="margin:0 0 16px;"><strong>${senderName}</strong>님이 보낸 새 포퐄챗 메시지가 도착했습니다.</p>
            <p style="margin:0 0 16px;">메시지 내용은 개인정보 보호를 위해 이메일에 표시하지 않습니다. 포퐄에서 확인해 주세요.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 36px;"><a href="${ctaUrl}" style="display:inline-block;background-color:#171411;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">포퐄챗 확인하기</a></td></tr>
          <tr><td style="padding:20px 32px 32px;border-top:1px solid #E5E1D8;"><p style="margin:0;font-size:12px;line-height:1.6;color:#8A8578;">이 이메일은 POPOK 포퐄챗 알림입니다.</p></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `안녕하세요, ${params.recipientName}님.`,
    "",
    `${params.senderName}님이 보낸 새 포퐄챗 메시지가 도착했습니다.`,
    "메시지 내용은 개인정보 보호를 위해 이메일에 표시하지 않습니다. 포퐄에서 확인해 주세요.",
    "",
    `포퐄챗 확인하기: ${ctaUrl}`,
  ].join("\n");

  return { subject, html, text };
}