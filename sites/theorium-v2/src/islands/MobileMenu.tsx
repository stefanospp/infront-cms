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

      {/* Always rendered — visibility controlled by CSS, not conditional rendering */}
      <div
        ref={menuRef}
        id="mobile-menu"
        style={{ position: 'fixed', top: '5rem', left: 0, right: 0, height: 'calc(100vh - 5rem)', zIndex: 40, backgroundColor: '#fff', overflowY: 'auto' }}
        className={`transition-all duration-300 ${
          open
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        <nav aria-label="Mobile navigation" className="flex flex-col items-center gap-6 pt-12 pb-20 px-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-bold text-lg uppercase tracking-wider hover:text-blue-800 transition-colors"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/contact"
            className="btn-brutal px-8 py-3 text-sm mt-4"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
          >
            Get in touch
          </a>
        </nav>
      </div>
    </div>
  );
}
