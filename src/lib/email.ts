import "server-only";
import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const isDryRun = process.env.EMAIL_DRY_RUN === "true";

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  const ses = new SESv2Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  cachedTransport = nodemailer.createTransport({
    SES: { sesClient: ses, SendEmailCommand },
  });

  return cachedTransport;
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendEmail({ to, subject, html, text }: SendArgs) {
  if (isDryRun) {
    // Lets the whole moderation flow be demoed before SES identities are
    // verified. Flip EMAIL_DRY_RUN to "false" to send for real.
    console.info(`[email:dry-run] to=${to} subject="${subject}"\n${text}`);

    // Set EMAIL_PREVIEW_DIR to dump the rendered HTML for design work.
    if (process.env.EMAIL_PREVIEW_DIR) {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const path = await import("node:path");
      const slug = subject.replace(/[^a-z0-9]+/gi, "-").slice(0, 60).toLowerCase();
      await mkdir(process.env.EMAIL_PREVIEW_DIR, { recursive: true });
      await writeFile(path.join(process.env.EMAIL_PREVIEW_DIR, `${slug}.html`), html);
    }
    return;
  }

  await getTransport().sendMail({
    from: process.env.SES_FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });
}

// Ad titles and moderator notes are user-written, so they must never reach the
// markup raw.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

type LayoutOptions = {
  accent: string;
  badge: string;
  badgeBg: string;
  preheader: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

/**
 * Table-based layout with inline styles. Email clients — Outlook especially —
 * ignore <style> blocks, flexbox and grid, so this deliberately uses the markup
 * of about 2005.
 */
function layout(o: LayoutOptions) {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(o.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${o.accent};border-radius:12px 12px 0 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0;">
              <span style="font-family:${FONT};font-size:17px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">Hurry</span>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;">
              <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${o.badgeBg};color:${o.accent};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">${escapeHtml(o.badge)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px 0;">
              <h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#18181b;">${escapeHtml(o.heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:#52525b;">
              ${o.body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#18181b;border-radius:8px;">
                    <a href="${o.ctaUrl}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(o.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="height:1px;line-height:1px;font-size:0;background:#e4e4e7;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;font-family:${FONT};font-size:12px;line-height:1.5;color:#a1a1aa;">
              You are receiving this because you posted an advertisement on Hurry.<br />
              This is an automated message — please do not reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAdApprovedEmail(opts: {
  to: string;
  adTitle: string;
  adUrl: string;
}) {
  const title = escapeHtml(opts.adTitle);

  await sendEmail({
    to: opts.to,
    subject: `Your ad "${opts.adTitle}" is now live`,
    text: [
      "Your ad is live",
      "",
      `"${opts.adTitle}" has been approved and is now visible to buyers on Hurry.`,
      "",
      `View your listing: ${opts.adUrl}`,
      "",
      "— Hurry. This is an automated message.",
    ].join("\n"),
    html: layout({
      accent: "#16a34a",
      badge: "Approved",
      badgeBg: "#f0fdf4",
      preheader: `"${opts.adTitle}" is now visible to buyers.`,
      heading: "Your ad is live",
      body: `<p style="margin:0 0 14px;"><strong style="color:#18181b;">${title}</strong> has been approved and is now visible to buyers.</p>
             <p style="margin:0;">Buyers can now find it through search and contact you directly.</p>`,
      ctaLabel: "View your listing",
      ctaUrl: opts.adUrl,
    }),
  });
}

export async function sendAdRejectedEmail(opts: {
  to: string;
  adTitle: string;
  reason: string;
  editUrl: string;
}) {
  const title = escapeHtml(opts.adTitle);
  const reason = escapeHtml(opts.reason).replace(/\n/g, "<br />");

  await sendEmail({
    to: opts.to,
    subject: `Action needed on your ad "${opts.adTitle}"`,
    text: [
      "Your ad needs changes",
      "",
      `"${opts.adTitle}" was not approved.`,
      "",
      "Moderator note:",
      opts.reason,
      "",
      `Make the changes and repost: ${opts.editUrl}`,
      "",
      "— Hurry. This is an automated message.",
    ].join("\n"),
    html: layout({
      accent: "#dc2626",
      badge: "Needs changes",
      badgeBg: "#fef2f2",
      preheader: `"${opts.adTitle}" was not approved — see the moderator's note.`,
      heading: "Your ad needs changes",
      body: `<p style="margin:0 0 16px;"><strong style="color:#18181b;">${title}</strong> was not approved.</p>
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border-left:3px solid #dc2626;border-radius:0 6px 6px 0;">
               <tr>
                 <td style="padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:#3f3f46;">
                   <span style="display:block;margin-bottom:6px;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#a1a1aa;">Moderator note</span>
                   ${reason}
                 </td>
               </tr>
             </table>
             <p style="margin:16px 0 0;">Please make these changes and post the ad again.</p>`,
      ctaLabel: "Go to my ads",
      ctaUrl: opts.editUrl,
    }),
  });
}
