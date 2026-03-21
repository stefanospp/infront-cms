import { useState, type FormEvent } from 'react';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface Props {
  action?: string;
  successMessage?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm({
  action = '/api/contact',
  successMessage = 'Thank you! Your message has been sent successfully.',
}: Props) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');

  function validate(name: string, email: string, message: string): FieldErrors {
    const errors: FieldErrors = {};

    if (!name || name.length < 1) {
      errors.name = 'Name is required.';
    } else if (name.length > 200) {
      errors.name = 'Name must be 200 characters or fewer.';
    }

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!message || message.length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    } else if (message.length > 5000) {
      errors.message = 'Message must be 5000 characters or fewer.';
    }

    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get('name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const message = (formData.get('message') as string) || '';
    const honeypot = (formData.get('website') as string) || '';

    // Honeypot check
    if (honeypot) {
      setStatus('success');
      return;
    }

    const errors = validate(name, email, message);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(action, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message. Please try again.');
      }

      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setServerError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="success-message"
        className="rounded-xl border border-green-200 bg-green-50 p-8 text-center"
      >
        <svg
          className="mx-auto mb-4 h-12 w-12 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-semibold text-green-800">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot field - hidden from users */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">
          Do not fill this out
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-neutral-700"
        >
          Name
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          maxLength={200}
          aria-describedby={fieldErrors.name ? 'error-name' : undefined}
          aria-invalid={!!fieldErrors.name}
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
          placeholder="Your name"
        />
        {fieldErrors.name && (
          <p
            id="error-name"
            data-testid="error-name"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-neutral-700"
        >
          Email
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          aria-describedby={fieldErrors.email ? 'error-email' : undefined}
          aria-invalid={!!fieldErrors.email}
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
          placeholder="you@example.com"
        />
        {fieldErrors.email && (
          <p
            id="error-email"
            data-testid="error-email"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-neutral-700"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          minLength={10}
          maxLength={5000}
          aria-describedby={fieldErrors.message ? 'error-message' : undefined}
          aria-invalid={!!fieldErrors.message}
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors resize-y"
          placeholder="How can we help you?"
        />
        {fieldErrors.message && (
          <p
            id="error-message"
            data-testid="error-message"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {fieldErrors.message}
          </p>
        )}
      </div>

      {/* Server Error */}
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' ? (
          <>
            <svg
              className="mr-2 h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
