import { useState, useEffect, useRef, useCallback } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  analyticsProvider?: 'plausible' | 'fathom' | 'google';
  siteId?: string;
}

const STORAGE_KEY = 'cookie-consent';

type ConsentState = 'undecided' | 'accepted' | 'declined';

function getStoredConsent(): ConsentState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted' || stored === 'declined') {
      return stored;
    }
  } catch {
    // localStorage may not be available
  }
  return 'undecided';
}

function storeConsent(value: 'accepted' | 'declined') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function loadGoogleAnalytics(siteId: string) {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${siteId}"]`)) {
    return;
  }

  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${siteId}`;
  document.head.appendChild(gtagScript);

  const inlineScript = document.createElement('script');
  inlineScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${siteId}');
  `;
  document.head.appendChild(inlineScript);
}

export default function CookieConsent(props: Props) {
  return (
    <ErrorBoundary>
      <CookieConsentInner {...props} />
    </ErrorBoundary>
  );
}

function CookieConsentInner({ analyticsProvider, siteId }: Props) {
  const [consent, setConsent] = useState<ConsentState>('undecided');
  const [mounted, setMounted] = useState(false);
  const declineRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    setMounted(true);

    // If previously accepted, load GA
    if (stored === 'accepted' && analyticsProvider === 'google' && siteId) {
      loadGoogleAnalytics(siteId);
    }
  }, [analyticsProvider, siteId]);

  const setDeclineRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      node.focus();
    }
    (declineRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  }, []);

  // Only render for Google Analytics
  if (analyticsProvider !== 'google') {
    return null;
  }

  // Don't render on server or if consent already given
  if (!mounted || consent !== 'undecided') {
    return null;
  }

  function handleAccept() {
    storeConsent('accepted');
    setConsent('accepted');
    if (siteId) {
      loadGoogleAnalytics(siteId);
    }
  }

  function handleDecline() {
    storeConsent('declined');
    setConsent('declined');
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-neutral-600">
          We use cookies to analyze site traffic and optimize your experience.
          By accepting, you consent to our use of analytics cookies.
        </p>
        <div className="flex flex-shrink-0 gap-3">
          <button
            type="button"
            ref={setDeclineRef}
            onClick={handleDecline}
            className="rounded-lg border border-neutral-300 bg-white px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
