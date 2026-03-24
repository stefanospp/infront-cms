import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { componentOverridePlugin, editorBridgePlugin } from '@agency/utils';

export default defineConfig({
  site: 'https://videoshoot.infront.cy',
  output: 'static',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      componentOverridePlugin(import.meta.dirname),
      editorBridgePlugin(),
    ],
  },
});
