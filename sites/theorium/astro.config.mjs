import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { componentOverridePlugin, editorBridgePlugin } from '@agency/utils';

export default defineConfig({
  site: 'https://theorium.infront.cy',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap(),
  ],
  image: {
    domains: ['cms.theorium.infront.cy'],
  },
  vite: {
    plugins: [
      tailwindcss(),
      componentOverridePlugin(import.meta.dirname),
      editorBridgePlugin(),
    ],
  },
});
