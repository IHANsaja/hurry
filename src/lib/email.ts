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

const shell = (heading: string, body: string) => `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
    <h2 style="color:#111">${heading}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
    <p style="color:#777;font-size:12px">Hurry — automated message.</p>
  </div>
`;

export async function sendAdApprovedEmail(opts: {
  to: string;
  adTitle: string;
  adUrl: string;
}) {
  await sendEmail({
    to: opts.to,
    subject: `Your ad "${opts.adTitle}" is now live`,
    text: `Good news — your advertisement "${opts.adTitle}" has been approved and is now visible to buyers.\n\nView it here: ${opts.adUrl}`,
    html: shell(
      "Your ad is live 🎉",
      `<p>Your advertisement <strong>${opts.adTitle}</strong> has been approved and is now visible to buyers.</p>
       <p><a href="${opts.adUrl}">View your listing</a></p>`,
    ),
  });
}

export async function sendAdRejectedEmail(opts: {
  to: string;
  adTitle: string;
  reason: string;
  editUrl: string;
}) {
  await sendEmail({
    to: opts.to,
    subject: `Action needed on your ad "${opts.adTitle}"`,
    text: `Your advertisement "${opts.adTitle}" was not approved.\n\nModerator note: ${opts.reason}\n\nPlease amend and resubmit: ${opts.editUrl}`,
    html: shell(
      "Your ad needs changes",
      `<p>Your advertisement <strong>${opts.adTitle}</strong> was not approved.</p>
       <p style="background:#fef2f2;border-left:3px solid #dc2626;padding:12px">
         <strong>Moderator note:</strong><br/>${opts.reason}
       </p>
       <p>Please make the changes above and resubmit: <a href="${opts.editUrl}">My ads</a></p>`,
    ),
  });
}
