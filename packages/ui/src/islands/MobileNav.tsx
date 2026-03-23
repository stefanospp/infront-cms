import { useState, useEffect, useRef, useCallback } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface NavItem {
  label: string;
  href: string;
}

interface NavCTA {
  label: string;
  href: string;
}

interface Props {
  items: NavItem[];
  cta?: NavCTA;
}

export default function MobileNav(props: Props) {
  return (
    <ErrorBoundary>
      <MobileNavInner {...props} />
    </ErrorBoundary>
  );
}

function MobileNavInner({ items, cta }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const focusableElements = menu.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    menu.addEventListener('keydown', handleTab);
    return () => menu.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Toggle */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        data-testid="mobile-menu-toggle"
        className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors md:hidden"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Panel */}
      <div
        ref={menuRef}
        id="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        data-testid="mobile-menu"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col px-6 py-6">
          {/* Close Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 flex-1 space-y-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="block rounded-lg px-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary-600 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          {cta && (
            <div className="mt-auto border-t border-neutral-200 pt-6">
              <a
                href={cta.href}
                onClick={close}
                className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                {cta.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
