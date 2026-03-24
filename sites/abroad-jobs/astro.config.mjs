import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { componentOverridePlugin, editorBridgePlugin } from '@agency/utils';

export default defineConfig({
  site: 'https://abroadjobs.eu',
  output: 'static',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      componentOverridePlugin(import.meta.dirname),
      editorBridgePlugin(),
    ],
  },
});
