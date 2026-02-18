export type EmailBranding = {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export type BrandedEmailTemplateInput = {
  branding: EmailBranding;
  preheader: string;
  title: string;
  intro: string;
  bulletPoints: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
};

export type BrandedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildInvitationEmailTemplate(
  input: BrandedEmailTemplateInput & { recipientEmail: string }
): BrandedEmailTemplate {
  const companyName = input.branding.companyName.trim() || "Brand Radar";
  const primaryColor = input.branding.primaryColor || "#171a20";
  const secondaryColor = input.branding.secondaryColor || "#2563eb";
  const safeTitle = escapeHtml(input.title);
  const safeIntro = escapeHtml(input.intro);
  const safePreheader = escapeHtml(input.preheader);
  const safeCompanyName = escapeHtml(companyName);
  const safeRecipient = escapeHtml(input.recipientEmail);
  const safeFooter = escapeHtml(input.footerNote ?? "If you did not expect this email, you can ignore it.");
  const safeCtaLabel = escapeHtml(input.ctaLabel);
  const safeCtaUrl = escapeHtml(input.ctaUrl);

  const bulletItems = input.bulletPoints
    .map((item) => `<li style="margin: 0 0 8px 0;">${escapeHtml(item)}</li>`)
    .join("");

  const logoMarkup = input.branding.logoUrl
    ? `<img src="${escapeHtml(input.branding.logoUrl)}" alt="${safeCompanyName} logo" width="40" height="40" style="display:block;border-radius:10px;border:1px solid #e5e7eb;object-fit:cover;" />`
    : `<div style="width:40px;height:40px;border-radius:10px;background:${primaryColor};color:#fff;font-weight:700;font-family:Arial,sans-serif;font-size:12px;line-height:40px;text-align:center;">${escapeHtml(
        companyName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("") || "BR"
      )}</div>`;

  const subject = `${companyName} invited you to Brand Radar`;
  const html = `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(135deg, ${primaryColor}, ${secondaryColor});">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:52px;vertical-align:middle;">${logoMarkup}</td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.78);">Workspace Invitation</p>
                      <p style="margin:4px 0 0 0;font-size:18px;font-weight:700;color:#ffffff;">${safeCompanyName}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;color:#111827;">${safeTitle}</h1>
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#374151;">${safeIntro}</p>
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#374151;">
                  Invited account: <strong>${safeRecipient}</strong>
                </p>
                <ul style="padding-left:18px;margin:0 0 18px 0;font-size:14px;line-height:1.65;color:#4b5563;">
                  ${bulletItems}
                </ul>
                <a href="${safeCtaUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">
                  ${safeCtaLabel}
                </a>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;">${safeFooter}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${companyName} invited you to Brand Radar`,
    "",
    input.intro,
    `Invited account: ${input.recipientEmail}`,
    "",
    ...input.bulletPoints.map((item) => `- ${item}`),
    "",
    `${input.ctaLabel}: ${input.ctaUrl}`,
    "",
    input.footerNote ?? "If you did not expect this email, you can ignore it."
  ].join("\n");

  return { subject, html, text };
}
