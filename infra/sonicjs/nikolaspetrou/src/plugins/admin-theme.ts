/**
 * Nikolas Petrou Admin Theme
 *
 * Injects into admin pages via afterAuth middleware:
 * - White-label: replaces all SonicJs branding with Nikolas Petrou
 * - Light theme by default with dark mode toggle
 * - Custom CSS for clean light UI
 */

// ─── White-Label Replacements ─────────────────────────────────────────────────
// Each entry: [searchString, replacementString]
// Applied server-side before HTML reaches the browser.

export const WHITE_LABEL: [string, string][] = [
  // Page titles
  ['SonicJS AI Admin', 'Nikolas Petrou CMS'],
  ['SonicJS AI', 'Nikolas Petrou CMS'],
  ['SonicJS', 'Nikolas Petrou'],
  ['Sonic JS', 'Nikolas Petrou'],

  // Dashboard text
  ['Welcome to your Nikolas Petrou CMS admin dashboard', 'Welcome to the Nikolas Petrou content management system'],
  ['A modern headless CMS powered by AI', 'Videographer Private Science & Maths Tutoring Content Creator — Content Management'],

  // Login page
  ['Welcome Back', 'Nikolas Petrou CMS'],
  ['Sign in to your account to continue', 'Sign in to manage your content'],
];

// Replace the SonicJs SVG logo + version badge with Nikolas Petrou text logo.
// Uses regex because the SVG is a large inline blob that can't be matched with simple strings.
const THEORIUM_LOGO = '<span style="font-size:20px;font-weight:700;letter-spacing:-0.5px;color:#465FFF;">Nikolas Petrou</span> <span style="font-size:11px;color:#94a3b8;font-weight:500;">CMS</span>';

export function whiteLabel(html: string): string {
  // Replace all simple string pairs
  for (const [search, replace] of WHITE_LABEL) {
    html = html.split(search).join(replace);
  }

  // Replace the SVG logo (viewBox="380 1300 2250 400") + version badge with Nikolas Petrou text
  html = html.replace(
    /<svg[^>]*viewBox="380 1300 2250 400"[^>]*>[\s\S]*?<\/svg>/g,
    THEORIUM_LOGO
  );

  // Remove version badge spans (e.g. "2.8.0")
  html = html.replace(
    /<span[^>]*class="[^"]*rounded-md[^"]*"[^>]*>\s*[\d.]+\s*<\/span>/g,
    ''
  );

  return html;
}

// ─── Theme Toggle Script ──────────────────────────────────────────────────────

// Note: This script runs in the trusted admin context only (authenticated users).
// It does not process any user-generated content — only toggles CSS classes.
export const THEME_SCRIPT = `
<script>
(function() {
  var theme = localStorage.getItem('sonicjs-theme');
  if (!theme) {
    theme = 'light';
    localStorage.setItem('sonicjs-theme', 'light');
  }

  var html = document.documentElement;

  function applyTheme(t) {
    if (t === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('sonicjs-theme', t);
  }

  applyTheme(theme);

  document.addEventListener('DOMContentLoaded', function() {
    var headerButtons = document.querySelector('header .flex.items-center') ||
                        document.querySelector('header div:last-child') ||
                        document.querySelector('header');
    if (!headerButtons) return;

    var btn = document.createElement('button');
    btn.id = 'nikolaspetrou-theme-toggle';
    btn.title = 'Toggle light/dark theme';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid rgba(0,0,0,0.1);background:transparent;cursor:pointer;color:inherit;margin-left:8px;transition:all 0.2s;';

    // Use text content for the toggle (safe, no HTML injection)
    btn.textContent = theme === 'dark' ? '\\u2600\\uFE0F' : '\\uD83C\\uDF19';

    btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(0,0,0,0.05)'; });
    btn.addEventListener('mouseleave', function() { btn.style.background = 'transparent'; });

    btn.addEventListener('click', function() {
      var current = localStorage.getItem('sonicjs-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      btn.textContent = next === 'dark' ? '\\u2600\\uFE0F' : '\\uD83C\\uDF19';
    });

    headerButtons.appendChild(btn);
  });
})();
</script>
`;

// ─── Custom CSS ───────────────────────────────────────────────────────────────

export const CUSTOM_CSS = `
<style id="nikolaspetrou-theme">
  /* ── Light Theme ─────────────────────────────────────────────── */

  html:not(.dark) {
    --th-bg: #f8fafc;
    --th-sidebar-bg: #ffffff;
    --th-card-bg: #ffffff;
    --th-border: #e2e8f0;
    --th-text: #1e293b;
    --th-text-secondary: #64748b;
    --th-accent: #465FFF;
    --th-accent-hover: #3b50e0;
    --th-hover: #f1f5f9;
    --th-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  }

  html:not(.dark) body {
    background: var(--th-bg) !important;
    color: var(--th-text) !important;
  }

  /* Sidebar */
  html:not(.dark) aside,
  html:not(.dark) [class*="w-64"][class*="fixed"],
  html:not(.dark) [class*="sidebar"] {
    background: var(--th-sidebar-bg) !important;
    border-right: 1px solid var(--th-border) !important;
    box-shadow: 1px 0 4px rgba(0,0,0,0.03) !important;
  }

  html:not(.dark) aside *,
  html:not(.dark) [class*="sidebar"] * {
    color: var(--th-text) !important;
  }

  html:not(.dark) aside a:hover,
  html:not(.dark) [class*="sidebar"] a:hover {
    background: var(--th-hover) !important;
  }

  html:not(.dark) aside a[class*="bg-"] {
    background: #eef2ff !important;
    color: var(--th-accent) !important;
  }

  /* Header */
  html:not(.dark) header {
    background: var(--th-sidebar-bg) !important;
    border-bottom: 1px solid var(--th-border) !important;
    color: var(--th-text) !important;
  }

  html:not(.dark) header * {
    color: var(--th-text) !important;
  }

  /* Cards and dark backgrounds */
  html:not(.dark) [class*="bg-zinc-800"],
  html:not(.dark) [class*="bg-zinc-900"],
  html:not(.dark) [class*="bg-zinc-950"] {
    background: var(--th-card-bg) !important;
    color: var(--th-text) !important;
  }

  html:not(.dark) [class*="rounded"][class*="shadow"],
  html:not(.dark) [class*="rounded-lg"][class*="border"] {
    background: var(--th-card-bg) !important;
    border-color: var(--th-border) !important;
    box-shadow: var(--th-shadow) !important;
  }

  html:not(.dark) main {
    background: var(--th-bg) !important;
  }

  /* Form inputs */
  html:not(.dark) input:not([type="checkbox"]):not([type="radio"]),
  html:not(.dark) textarea,
  html:not(.dark) select {
    background: #ffffff !important;
    color: var(--th-text) !important;
    border-color: var(--th-border) !important;
    border-radius: 8px !important;
  }

  html:not(.dark) input:focus,
  html:not(.dark) textarea:focus,
  html:not(.dark) select:focus {
    border-color: var(--th-accent) !important;
    box-shadow: 0 0 0 3px rgba(70, 95, 255, 0.12) !important;
    outline: none !important;
  }

  /* Tables */
  html:not(.dark) table { border-color: var(--th-border) !important; }
  html:not(.dark) th { background: #f8fafc !important; color: var(--th-text) !important; border-color: var(--th-border) !important; }
  html:not(.dark) td { color: var(--th-text) !important; border-color: var(--th-border) !important; }
  html:not(.dark) tr:hover td { background: var(--th-hover) !important; }

  /* Text */
  html:not(.dark) h1, html:not(.dark) h2, html:not(.dark) h3, html:not(.dark) h4 { color: var(--th-text) !important; }
  html:not(.dark) p, html:not(.dark) label { color: var(--th-text) !important; }
  html:not(.dark) [class*="text-zinc-4"], html:not(.dark) [class*="text-zinc-5"] { color: var(--th-text-secondary) !important; }

  /* Buttons */
  html:not(.dark) button[type="submit"],
  html:not(.dark) [class*="bg-blue-6"] {
    background: var(--th-accent) !important;
    color: #fff !important;
    border-radius: 8px !important;
  }

  html:not(.dark) button[type="submit"]:hover,
  html:not(.dark) [class*="bg-blue-6"]:hover {
    background: var(--th-accent-hover) !important;
  }

  /* Status badges */
  html:not(.dark) [class*="bg-emerald"] { background: #d1fae5 !important; color: #065f46 !important; }
  html:not(.dark) [class*="bg-amber"] { background: #fef3c7 !important; color: #92400e !important; }
  html:not(.dark) [class*="bg-red"]:not(button) { background: #fee2e2 !important; color: #991b1b !important; }

  /* Rings and borders */
  html:not(.dark) [class*="ring-white\\/"],
  html:not(.dark) [class*="ring-zinc"] {
    --tw-ring-color: var(--th-border) !important;
  }

  html:not(.dark) hr { border-color: var(--th-border) !important; }

  /* Login page */
  html:not(.dark) [class*="min-h-screen"] {
    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%) !important;
  }

  /* ── Shared Improvements ─────────────────────────────────────── */

  body, aside, header, main, input, textarea, select, button, a, tr, td {
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease !important;
  }

  [class*="rounded-lg"] {
    border-radius: 12px !important;
  }
</style>
`;
