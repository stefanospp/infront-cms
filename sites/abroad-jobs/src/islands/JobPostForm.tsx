import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { jobInputSchema, INDUSTRIES, VISA_OPTIONS, RELOCATION_OPTIONS } from '../lib/validation';

type JobFormData = z.infer<typeof jobInputSchema>;

const PRICE_PER_JOB = 89;

const emptyJob: JobFormData = {
  title: '',
  companyName: '',
  companyWebsite: '',
  country: '',
  industry: 'Technology',
  salaryRange: '',
  visaSupport: 'yes',
  relocationPkg: 'yes',
  workingLanguage: 'English',
  description: '',
  applyUrl: '',
};

export default function JobPostForm() {
  const [contactEmail, setContactEmail] = useState('');
  const [jobForms, setJobForms] = useState<JobFormData[]>([{ ...emptyJob }]);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = jobForms.length * PRICE_PER_JOB;

  function updateJob(index: number, field: keyof JobFormData, value: string) {
    setJobForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index]!, [field]: value };
      return updated;
    });
  }

  function addJob() {
    // Copy company details from the first job for convenience
    const first = jobForms[0]!;
    setJobForms((prev) => [
      ...prev,
      {
        ...emptyJob,
        companyName: first.companyName,
        companyWebsite: first.companyWebsite,
      },
    ]);
  }

  function removeJob(index: number) {
    if (jobForms.length <= 1) return;
    setJobForms((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    // Validate email
    const emailResult = z.string().email().safeParse(contactEmail);
    if (!emailResult.success) {
      setErrors({ contactEmail: 'Please enter a valid email address' });
      setSubmitting(false);
      return;
    }

    // Validate each job
    const validationErrors: Record<string, string> = {};
    for (let i = 0; i < jobForms.length; i++) {
      const result = jobInputSchema.safeParse(jobForms[i]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          validationErrors[`job_${i}_${issue.path[0]}`] = issue.message;
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactEmail,
          jobs: jobForms,
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || 'Something went wrong. Please try again.' });
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setErrors({ form: 'Network error. Please check your connection and try again.' });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact email (shared across all jobs) */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-neutral-700">
          Contact email <span className="text-neutral-400">(for receipt only, not shown publicly)</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="you@company.com"
        />
        {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
      </div>

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Job forms */}
      {jobForms.map((job, idx) => (
        <fieldset
          key={idx}
          className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <legend className="text-base font-semibold text-neutral-900">
              {jobForms.length > 1 ? `Job ${idx + 1}` : 'Job details'}
            </legend>
            {jobForms.length > 1 && (
              <button
                type="button"
                onClick={() => removeJob(idx)}
                className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Company name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Company name</label>
              <input
                type="text"
                required
                value={job.companyName}
                onChange={(e) => updateJob(idx, 'companyName', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {errors[`job_${idx}_companyName`] && <p className="mt-1 text-xs text-red-600">{errors[`job_${idx}_companyName`]}</p>}
            </div>

            {/* Company website */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Company website</label>
              <input
                type="url"
                value={job.companyWebsite}
                onChange={(e) => updateJob(idx, 'companyWebsite', e.target.value)}
                placeholder="https://"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Job title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Job title</label>
              <input
                type="text"
                required
                value={job.title}
                onChange={(e) => updateJob(idx, 'title', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {errors[`job_${idx}_title`] && <p className="mt-1 text-xs text-red-600">{errors[`job_${idx}_title`]}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Country</label>
              <input
                type="text"
                required
                value={job.country}
                onChange={(e) => updateJob(idx, 'country', e.target.value)}
                placeholder="e.g. Germany"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {errors[`job_${idx}_country`] && <p className="mt-1 text-xs text-red-600">{errors[`job_${idx}_country`]}</p>}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Industry</label>
              <select
                required
                value={job.industry}
                onChange={(e) => updateJob(idx, 'industry', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Salary range */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Salary range <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={job.salaryRange}
                onChange={(e) => updateJob(idx, 'salaryRange', e.target.value)}
                placeholder="e.g. €60,000 – €80,000"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Visa support */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Visa / work permit support</label>
              <select
                required
                value={job.visaSupport}
                onChange={(e) => updateJob(idx, 'visaSupport', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {/* Relocation package */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Relocation package</label>
              <select
                required
                value={job.relocationPkg}
                onChange={(e) => updateJob(idx, 'relocationPkg', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="allowance_only">Allowance only</option>
              </select>
            </div>

            {/* Working language */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Working language <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={job.workingLanguage}
                onChange={(e) => updateJob(idx, 'workingLanguage', e.target.value)}
                placeholder="e.g. English"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Apply URL */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Application URL or email</label>
              <input
                type="text"
                required
                value={job.applyUrl}
                onChange={(e) => updateJob(idx, 'applyUrl', e.target.value)}
                placeholder="https://company.com/apply or mailto:jobs@company.com"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {errors[`job_${idx}_applyUrl`] && <p className="mt-1 text-xs text-red-600">{errors[`job_${idx}_applyUrl`]}</p>}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Job description</label>
              <textarea
                required
                rows={8}
                value={job.description}
                onChange={(e) => updateJob(idx, 'description', e.target.value)}
                placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity unique..."
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {errors[`job_${idx}_description`] && <p className="mt-1 text-xs text-red-600">{errors[`job_${idx}_description`]}</p>}
            </div>
          </div>
        </fieldset>
      ))}

      {/* Add another job */}
      <button
        type="button"
        onClick={addJob}
        className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add another job
      </button>

      {/* Price summary + submit */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">
              {jobForms.length} {jobForms.length === 1 ? 'job' : 'jobs'} &times; &euro;{PRICE_PER_JOB}
            </p>
            <p className="mt-0.5 text-xl font-bold text-neutral-900">&euro;{totalPrice}</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Processing...' : `Pay & post ${jobForms.length === 1 ? 'job' : 'jobs'}`}
          </button>
        </div>
        {errors.form && <p className="mt-2 text-sm text-red-600">{errors.form}</p>}
      </div>
    </form>
  );
}
