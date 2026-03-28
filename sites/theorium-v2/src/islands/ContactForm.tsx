import { useState, type FormEvent } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot check
    if (data.get('website')) {
      setStatus('sent');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          contact: data.get('contact'),
          school: data.get('school'),
          message: data.get('message'),
        }),
      });

      if (res.ok) {
        setStatus('sent');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" aria-live="polite" className="bg-white p-8 border-2 border-gray-200 shadow-lg flex items-center justify-center min-h-[400px] rounded-sm">
        <div className="text-center">
          <div className="text-4xl mb-4" aria-hidden="true">&#10003;</div>
          <p className="font-black text-xl uppercase">Message sent!</p>
          <p className="text-sm font-medium text-gray-600 mt-2">We'll get back to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 border-2 border-gray-200 shadow-lg rounded-sm"
      noValidate
    >
      {/* Honeypot */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="mb-4">
        <label htmlFor="name" className="block text-xs font-black uppercase tracking-widest mb-2">Name</label>
        <input
          id="name"
          type="text"
          name="name"
          required
          aria-required="true"
          className="w-full border border-gray-300 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          placeholder="Your name"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contact" className="block text-xs font-black uppercase tracking-widest mb-1">Contact</label>
        <span id="contact-hint" className="block text-xs text-gray-500 mb-2">Email address or WhatsApp number</span>
        <input
          id="contact"
          type="text"
          name="contact"
          required
          aria-required="true"
          aria-describedby="contact-hint"
          className="w-full border border-gray-300 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          placeholder="Email or WhatsApp"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="school" className="block text-xs font-black uppercase tracking-widest mb-2">School</label>
        <input
          id="school"
          type="text"
          name="school"
          className="w-full border border-gray-300 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          placeholder="Your school name"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="message" className="block text-xs font-black uppercase tracking-widest mb-2">Message</label>
        <textarea
          id="message"
          name="message"
          required
          aria-required="true"
          className="w-full border border-gray-300 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 h-24"
          placeholder="Tell me about your goals..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-gray-900 text-white font-bold uppercase tracking-widest py-4 hover:bg-gray-700 transition-colors border-2 border-gray-900 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending...' : 'Send Message →'}
      </button>

      {status === 'error' && (
        <p role="alert" className="mt-3 text-sm font-bold text-red-600">Something went wrong. Please try again or use WhatsApp.</p>
      )}
    </form>
  );
}
