import { useState, useEffect, useRef } from 'react';

interface Link {
  label: string;
  href: string;
}

interface Props {
  links: Link[];
}

export default function MobileMenu({ links }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const firstLink = menuRef.current?.querySelector<HTMLElement>('a[href]');
    firstLink?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative z-50 w-10 h-10 flex items-center justify-center font-black text-2xl"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className="fixed inset-0 top-20 bg-white z-40 overflow-y-auto"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col items-center gap-6 pt-12 pb-20 px-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-bold text-lg uppercase tracking-wider hover:text-blue-800 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/contact"
              className="btn-brutal px-8 py-3 text-sm mt-4"
              onClick={() => setOpen(false)}
            >
              Get in touch
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
