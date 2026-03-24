import { useState, type FormEvent } from 'react';

interface FieldErrors {
  name?: string;
  contact?: string;
  schoolSubject?: string;
  message?: string;
}

interface Props {
  action?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm({ action = '/api/contact' }: Props) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');

  function validate(name: string, contact: string): FieldErrors {
    const errors: FieldErrors = {};

    if (!name || name.length < 1) {
      errors.name = 'Name is required.';
    } else if (name.length > 200) {
      errors.name = 'Name must be 200 characters or fewer.';
    }

    if (!contact || contact.length < 1) {
      errors.contact = 'Phone or email is required.';
    } else if (contact.length > 200) {
      errors.contact = 'Must be 200 characters or fewer.';
    }

    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get('name') as string) || '';
    const contact = (formData.get('contact') as string) || '';
    const honeypot = (formData.get('website') as string) || '';

    // Honeypot check
    if (honeypot) {
      setStatus('success');
      return;
    }

    const errors = validate(name, contact);
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
        className="rounded-lg border border-neutral-300 bg-[var(--th-green)]/30 p-8 text-center"
      >
        <svg
          className="mx-auto mb-4 h-10 w-10 text-[var(--th-green)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-base font-bold">Message sent!</p>
        <p className="mt-1 text-sm text-neutral-600">Theodora will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">
          Do not fill this out
          <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="block font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-600">
          Your name
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          maxLength={200}
          placeholder="e.g. Andreas Papadopoulos"
          aria-describedby={fieldErrors.name ? 'error-name' : undefined}
          aria-invalid={!!fieldErrors.name}
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--th-yellow)] focus:border-transparent"
        />
        {fieldErrors.name && (
          <p id="error-name" role="alert" className="mt-1 text-xs font-bold text-red-600">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Phone or email */}
      <div>
        <label htmlFor="contact-contact" className="block font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-600">
          Phone or email
        </label>
        <input
          type="text"
          id="contact-contact"
          name="contact"
          required
          maxLength={200}
          placeholder="Best way to reach you"
          aria-describedby={fieldErrors.contact ? 'error-contact' : undefined}
          aria-invalid={!!fieldErrors.contact}
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--th-yellow)] focus:border-transparent"
        />
        {fieldErrors.contact && (
          <p id="error-contact" role="alert" className="mt-1 text-xs font-bold text-red-600">
            {fieldErrors.contact}
          </p>
        )}
      </div>

      {/* School & subject */}
      <div>
        <label htmlFor="contact-school" className="block font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-600">
          School &amp; subject
        </label>
        <input
          type="text"
          id="contact-school"
          name="schoolSubject"
          maxLength={500}
          placeholder="e.g. Pascal · A-Level Chemistry"
          className="mt-1.5 block w-full rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--th-yellow)] focus:border-transparent"
        />
      </div>

      {/* Anything else */}
      <div>
        <label htmlFor="contact-message" className="block font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-600">
          Anything else
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={3}
          maxLength={5000}
          placeholder="Level, exam coming up, specific topics..."
          className="mt-1.5 block w-full resize-y rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--th-yellow)] focus:border-transparent"
        />
      </div>

      {/* Server error */}
      {serverError && (
        <div role="alert" aria-live="polite" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-md border-2 border-[var(--th-black)] bg-[var(--th-black)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[var(--th-shadow)] transition-all hover:bg-[var(--th-yellow)] hover:text-[var(--th-black)] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'submitting' ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send message →'
        )}
      </button>
    </form>
  );
}
