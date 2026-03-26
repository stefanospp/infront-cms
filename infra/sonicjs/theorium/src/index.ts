import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { CollectionConfig } from '@sonicjs-cms/core';
import { THEME_SCRIPT, CUSTOM_CSS, whiteLabel } from './plugins/theorium-admin';

// Site settings (replaces site.config.ts)
import siteSettings from './collections/site-settings.collection';

// Site content (split into 4 focused collections)
import heroContent from './collections/hero-content.collection';
import sectionHeadings from './collections/section-headings.collection';
import pageContent from './collections/page-content.collection';
import contactContent from './collections/contact-content.collection';

// Pages (page builder)
import pages from './collections/pages.collection';

// Data collections
import medicalBlock from './collections/medical-block.collection';
import resources from './collections/resources.collection';
import courses from './collections/courses.collection';
import schools from './collections/schools.collection';
import examDestinations from './collections/exam-destinations.collection';
import tutoringTiers from './collections/tutoring-tiers.collection';
import tutoringSteps from './collections/tutoring-steps.collection';
import tutoringSubjects from './collections/tutoring-subjects.collection';

const collections: CollectionConfig[] = [
  // Settings
  siteSettings,
  // Site content
  heroContent,
  sectionHeadings,
  pageContent,
  contactContent,
  // Pages
  pages,
  // Data
  medicalBlock,
  resources,
  courses,
  schools,
  examDestinations,
  tutoringTiers,
  tutoringSteps,
  tutoringSubjects,
];

registerCollections(collections);

const app = createSonicJSApp({
  collections: {
    autoSync: true,
  },
  plugins: {
    autoLoad: true,
  },
  middleware: {
    // Inject Theorium light theme + branding into admin pages
    afterAuth: [
      async (c, next) => {
        await next();

        // Only modify admin HTML responses
        const url = new URL(c.req.url);
        if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth')) return;

        const contentType = c.res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) return;

        let html = await c.res.text();

        // Remove dark class server-side to prevent flash of dark theme
        html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (match, before, after) => {
          const cleaned = `${before}${after}`.replace(/\s+/g, ' ').trim();
          return cleaned ? `class="${cleaned}"` : '';
        });

        // White-label: replace all SonicJs branding with Theorium
        html = whiteLabel(html);

        // Inject CSS in <head> and theme toggle script before </body>
        html = html
          .replace('</head>', `${CUSTOM_CSS}\n</head>`)
          .replace('</body>', `${THEME_SCRIPT}\n</body>`);

        c.res = new Response(html, {
          status: c.res.status,
          headers: c.res.headers,
        });
      },
    ],
  },
});

export default app;
