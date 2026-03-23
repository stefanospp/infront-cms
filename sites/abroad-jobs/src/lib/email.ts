import { Resend } from 'resend';
import type { Job } from './schema';

interface ResendLike {
  emails: {
    send: (params: Record<string, unknown>) => Promise<unknown>;
  };
}

export function getResend(apiKey: string | undefined): ResendLike {
  if (!apiKey) {
    return {
      emails: {
        send: async () => {
          console.warn('[email] RESEND_API_KEY not set — skipping email send');
          return { id: 'noop' };
        },
      },
    };
  }
  return new Resend(apiKey);
}

const BUSINESS_ADDRESS = 'AbroadJobs.eu, Limassol, Cyprus';
const EMAIL_TIMEOUT_MS = 10_000;

function buildHtmlEmail(jobs: Job[], siteUrl: string): string {
  const jobRows = jobs
    .map(
      (j) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="${siteUrl}/jobs/${j.slug}" style="color: #1d4ed8; text-decoration: none; font-weight: 600;">${j.title}</a>
          <br />
          <span style="color: #6b7280; font-size: 14px;">at ${j.companyName}</span>
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">AbroadJobs.eu</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">Your ${jobs.length === 1 ? 'listing is' : 'listings are'} now live!</h2>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Thank you for posting on AbroadJobs.eu. Your ${jobs.length === 1 ? 'job' : 'jobs'} will be visible for 30 days.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${jobRows}
              </table>
              <p style="margin: 24px 0 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                If you have any questions, simply reply to this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                ${BUSINESS_ADDRESS}<br />
                You are receiving this email because you posted a job on AbroadJobs.eu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendConfirmationEmail(
  resend: ReturnType<typeof getResend>,
  toEmail: string,
  jobs: Job[],
  siteUrl: string,
) {
  const jobLinks = jobs
    .map((j) => `• ${j.title} at ${j.companyName} — ${siteUrl}/jobs/${j.slug}`)
    .join('\n');

  const textBody = `Thank you for posting on AbroadJobs.eu!

Your listings are now live and will be visible for 30 days:

${jobLinks}

If you have any questions, reply to this email.

— AbroadJobs.eu
${BUSINESS_ADDRESS}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    await resend.emails.send({
      from: 'AbroadJobs.eu <noreply@abroadjobs.eu>',
      to: toEmail,
      reply_to: toEmail,
      subject: `Your ${jobs.length === 1 ? 'job is' : `${jobs.length} jobs are`} now live on AbroadJobs.eu`,
      text: textBody,
      html: buildHtmlEmail(jobs, siteUrl),
    });
  } finally {
    clearTimeout(timeout);
  }
}
