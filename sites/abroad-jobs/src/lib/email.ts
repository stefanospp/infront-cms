import { Resend } from 'resend';
import type { Job } from './schema';

export function getResend(apiKey: string) {
  return new Resend(apiKey);
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

  await resend.emails.send({
    from: 'AbroadJobs.eu <noreply@abroadjobs.eu>',
    to: toEmail,
    subject: `Your ${jobs.length === 1 ? 'job is' : `${jobs.length} jobs are`} now live on AbroadJobs.eu`,
    text: `Thank you for posting on AbroadJobs.eu!

Your listings are now live and will be visible for 30 days:

${jobLinks}

If you have any questions, reply to this email.

— AbroadJobs.eu`,
  });
}
