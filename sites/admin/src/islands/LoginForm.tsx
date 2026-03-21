import { useState } from 'react';

type FormState = 'idle' | 'loading' | 'error';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<FormState>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (state === 'error') setState('idle');
          }}
          placeholder="Enter admin password"
          required
          autoFocus
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
        />
      </div>

      {state === 'error' && (
        <p className="text-sm text-danger-500 font-medium">
          Invalid password. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {state === 'loading' ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
