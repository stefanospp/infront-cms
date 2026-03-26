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

const collections: CollectionConfig[] = [
  siteSettings, hero, about, projects, services, testimonials, reels,
];

registerCollections(collections);

const app = createSonicJSApp({
  collections: { autoSync: true },
  plugins: { autoLoad: true },
  middleware: {
    afterAuth: [
      async (c, next) => {
        await next();
        const url = new URL(c.req.url);
        if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth')) return;
        const contentType = c.res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) return;

        let html = await c.res.text();

        html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (_, b, a) => {
          const cleaned = `${b}${a}`.replace(/\s+/g, ' ').trim();
          return cleaned ? `class="${cleaned}"` : '';
        });

        html = whiteLabel(html);

        const user = c.get('user') as { role?: string } | undefined;
        if (user && user.role !== 'admin') {
          html = html.replace(/<a[^>]*href="\/admin\/collections"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/users"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/plugins"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/cache"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/settings[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/forms"[^>]*>[\s\S]*?<\/a>/g, '');
        }

        html = html
          .replace('</head>', `${CUSTOM_CSS}\n</head>`)
          .replace('</body>', `${THEME_SCRIPT}\n</body>`);

        c.res = new Response(html, { status: c.res.status, headers: c.res.headers });
      },
    ],
  },
});

export default app;
