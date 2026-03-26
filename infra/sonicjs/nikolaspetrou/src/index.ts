import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { CollectionConfig } from '@sonicjs-cms/core';
import { THEME_SCRIPT, CUSTOM_CSS, whiteLabel } from './plugins/admin-theme';

import siteSettings from './collections/site-settings.collection';
import hero from './collections/hero.collection';
import about from './collections/about.collection';
import projects from './collections/projects.collection';
import services from './collections/services.collection';
import testimonials from './collections/testimonials.collection';
import reels from './collections/reels.collection';
import submissions from './collections/submissions.collection';
import formSettings from './collections/form-settings.collection';

const collections: CollectionConfig[] = [
  siteSettings, hero, about, projects, services, testimonials, reels, submissions, formSettings,
];

registerCollections(collections);

const app = createSonicJSApp({
  collections: { autoSync: true },
  plugins: { autoLoad: true },
  middleware: {
    // Block public registration (allow with seed secret for initial setup)
    beforeAuth: [
      async (c, next) => {
        const url = new URL(c.req.url);
        if (url.pathname === '/auth/register' && c.req.method === 'POST') {
          const seedSecret = c.req.header('x-seed-secret');
          const jwtSecret = c.env?.JWT_SECRET || '';
          if (seedSecret !== jwtSecret) {
            return c.json({ error: 'Registration is disabled. Contact the administrator.' }, 403);
          }
        }
        await next();
      },
    ],
    afterAuth: [
      async (c, next) => {
        await next();
        const url = new URL(c.req.url);
        if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth')) return;
        const contentType = c.res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) return;

        let html = await c.res.text();

        // Only modify full HTML pages, not HTMX partials
        if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
          c.res = new Response(html, { status: c.res.status, headers: c.res.headers });
          return;
        }

        html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (_, b, a) => {
          const cleaned = `${b}${a}`.replace(/\s+/g, ' ').trim();
          return cleaned ? `class="${cleaned}"` : '';
        });

        html = whiteLabel(html);

        // On login/register pages, clean up to show only the login card
        if (url.pathname.startsWith('/auth')) {
          html = html.replace(/<span style="font-size:20px[^"]*">Nikolas Petrou<\/span>\s*<span[^>]*>CMS<\/span>/g, '');
          html = html.replace(/<title>[^<]*<\/title>/, '<title>Login - CMS</title>');
        }

        // Hide Forms sidebar (not used — contact form is custom)
        html = html.replace(/<a[^>]*href="\/admin\/forms"[^>]*>[\s\S]*?<\/a>/g, '');

        // Role-based menu: hide admin-only items for editors
        const user = c.get('user') as { role?: string } | undefined;
        if (user && user.role !== 'admin') {
          html = html.replace(/<a[^>]*href="\/admin\/collections"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/users"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/plugins"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/cache"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/settings[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
        }

        // Override "Preview Content" button to open our staging preview
        const siteUrl = 'http://localhost:4322'; // TODO: change to production URL
        const previewToken = 'np-preview-2026-secret';
        html = html.replace(
          /<button[^>]*onclick="previewContent\(\)"[^>]*>[\s\S]*?<\/button>/g,
          `<a href="${siteUrl}/staging/?token=${previewToken}" target="_blank" class="w-full inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-zinc-100 rounded-lg transition-colors"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>Preview on Site</a>`
        );

        html = html
          .replace('</head>', `${CUSTOM_CSS}\n</head>`)
          .replace('</body>', `${THEME_SCRIPT}\n</body>`);

        c.res = new Response(html, { status: c.res.status, headers: c.res.headers });
      },
    ],
  },
});

export default app;
