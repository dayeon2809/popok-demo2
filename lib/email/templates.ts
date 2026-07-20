import { getSiteUrl } from "./client";

/** HTML-escapes user-supplied text before it's interpolated into an email
 * template — every template below must run any free-text field (names,
 * portfolio-request messages, ...) through this before use. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

interface BaseLayoutParams {
  subject: string;
  greetingName: string;
  bodyLines: string[]; // each rendered as its own paragraph, plain text (already escaped by caller if needed)
  ctaLabel: string;
  ctaPath: string; // relative path, e.g. "/my-popok"
}

/**
 * Shared base template for every POPOK transactional email — inline styles
 * only (no <style> block, no external CSS/JS — email client compatibility),
 * max 600px, white background / black text, black CTA button with white
 * text, plus a matching plain-text version. All free text passed in must
 * already be HTML-escaped by the caller (see escapeHtml above) since this
 * function does not escape anything itself — it only assembles markup.
 */
function baseEmailLayout({ subject, greetingName, bodyLines, ctaLabel, ctaPath }: BaseLayoutParams): EmailContent {
  const siteUrl = getSiteUrl();
  const ctaUrl = `${siteUrl}${ctaPath}`;

  const bodyHtmlParagraphs = bodyLines
    .map((line) => `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#171411;white-space:pre-line;">${line}</p>`)
    .join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#FAF9F5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E5E1D8;border-radius:12px;">
            <tr>
              <td style="padding:36px 32px 24px 32px;">
                <div style="font-size:20px;font-weight:900;color:#171411;letter-spacing:-0.02em;">POPOK</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#171411;">안녕하세요, ${greetingName}님.</p>
                ${bodyHtmlParagraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 36px 32px;">
                <a href="${ctaUrl}" style="display:inline-block;background-color:#171411;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">${ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px 32px;border-top:1px solid #E5E1D8;">
                <p style="margin:0 0 6px 0;font-size:12px;line-height:1.6;color:#8A8578;">이 메일은 POPOK 활동과 관련된 필수 알림입니다.</p>
                <p style="margin:0 0 6px 0;font-size:12px;line-height:1.6;color:#8A8578;">문의: popok.service@gmail.com</p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8578;">© POPOK</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `안녕하세요, ${greetingName}님.`,
    "",
    ...bodyLines,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    "이 메일은 POPOK 활동과 관련된 필수 알림입니다.",
    "문의: popok.service@gmail.com",
    "© POPOK",
  ].join("\n");

  return { subject, html, text };
}

export function buildArtistCompanyConnectionApprovedEmail(params: {
  artistName: string;
  companyName: string;
}): EmailContent {
  const artistName = escapeHtml(params.artistName);
  const companyName = escapeHtml(params.companyName);
  return baseEmailLayout({
    subject: "[POPOK] 단체 연결이 승인되었습니다",
    greetingName: artistName,
    bodyLines: [
      `${companyName}과의 단체 연결이 승인되었습니다.`,
      "이제 개인 포퐄에서 소속 단체가 표시되며, 연결된 단체 정보를 함께 관리할 수 있습니다.",
    ],
    ctaLabel: "내 포퐄 확인하기",
    ctaPath: "/my-popok",
  });
}

export function buildArtistProfileApprovedEmail(params: { artistName: string }): EmailContent {
  const artistName = escapeHtml(params.artistName);
  return baseEmailLayout({
    subject: "[POPOK] 개인 포퐄 등록이 승인되었습니다",
    greetingName: artistName,
    bodyLines: [
      "POPOK 개인 포퐄 등록이 승인되었습니다.",
      "이제 작품과 활동을 정리하고, 나만의 포퐄 링크를 공유할 수 있습니다.",
    ],
    ctaLabel: "내 포퐄 관리하기",
    ctaPath: "/my-popok",
  });
}

export function buildCompanyProfileApprovedEmail(params: {
  recipientName: string;
  companyName: string;
}): EmailContent {
  const recipientName = escapeHtml(params.recipientName);
  const companyName = escapeHtml(params.companyName);
  return baseEmailLayout({
    subject: "[POPOK] 단체 포퐄 등록이 승인되었습니다",
    greetingName: recipientName,
    bodyLines: [
      `${companyName}의 POPOK 단체 등록이 승인되었습니다.`,
      "이제 단체 소개, 대표 이미지, 작품, 수상 내역과 연락처 정보를 관리할 수 있습니다.",
    ],
    ctaLabel: "단체 포퐄 관리하기",
    ctaPath: "/my-popok",
  });
}

export function buildCompanyPortfolioRequestReceivedEmail(params: {
  representativeName: string;
  senderArtistName: string;
  companyName: string;
  message?: string | null;
}): EmailContent {
  const representativeName = escapeHtml(params.representativeName);
  const senderArtistName = escapeHtml(params.senderArtistName);
  const companyName = escapeHtml(params.companyName);
  const bodyLines = [`${senderArtistName}님이 ${companyName}에 포퐄을 보냈습니다.`];
  if (params.message && params.message.trim()) {
    bodyLines.push(`보낸 메시지:\n"${escapeHtml(params.message.trim())}"`);
  }
  return baseEmailLayout({
    subject: "[POPOK] 새로운 포퐄이 도착했습니다",
    greetingName: representativeName,
    bodyLines,
    ctaLabel: "받은 포퐄 확인하기",
    ctaPath: "/my-popok?tab=received-portfolios",
  });
}

export function buildArtistPortfolioRequestReceivedEmail(params: {
  recipientArtistName: string;
  senderArtistName: string;
  message?: string | null;
}): EmailContent {
  const recipientArtistName = escapeHtml(params.recipientArtistName);
  const senderArtistName = escapeHtml(params.senderArtistName);
  const bodyLines = [`${senderArtistName}님이 포퐄을 보냈습니다.`];
  if (params.message && params.message.trim()) {
    bodyLines.push(`보낸 메시지:\n"${escapeHtml(params.message.trim())}"`);
  }
  return baseEmailLayout({
    subject: "[POPOK] 새로운 포퐄이 도착했습니다",
    greetingName: recipientArtistName,
    bodyLines,
    ctaLabel: "받은 포퐄 확인하기",
    ctaPath: "/my-popok?tab=received-portfolios",
  });
}
