import { useState, type FormEvent } from 'react';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactFormDark() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const validate = (form: FormData): FormErrors => {
    const errs: FormErrors = {};
    const name = (form.get('name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const message = (form.get('message') as string)?.trim();

    if (!name || name.length < 1) errs.name = 'Name is required';
    if (name && name.length > 200) errs.name = 'Name is too long';
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email';
    if (!message || message.length < 10) errs.message = 'Message must be at least 10 characters';
    if (message && message.length > 5000) errs.message = 'Message is too long';

    return errs;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    // Honeypot check — if filled, pretend success
    if ((form.get('website') as string)?.length > 0) {
      setStatus('success');
      return;
    }

    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('submitting');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Server error (${res.status})`);
      }

      setStatus('success');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
          <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white">Message sent</h3>
        <p className="mt-2 text-sm text-neutral-400">Thank you for reaching out. I'll get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Name + Email row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-400">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            placeholder="Your name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-400">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
            placeholder="your@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-400">Phone <span className="text-neutral-600">(optional)</span></label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          placeholder="+357 99 123456"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-neutral-400">Message *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1.5 w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
          placeholder="Tell me about your project..."
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && <p id="message-error" className="mt-1 text-xs text-red-400">{errors.message}</p>}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3" role="alert">
          <p className="text-sm text-red-400">{serverError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 transition-all duration-300 hover:bg-neutral-200 disabled:opacity-50 sm:w-auto"
      >
        {status === 'submitting' ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </>
        ) : (
          'Send message'
        )}
      </button>
    </form>
  );
}
