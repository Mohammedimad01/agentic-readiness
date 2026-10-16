// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Optional: set SITE_URL at deploy time. Pages are noindex, so no canonical URLs are emitted.
  site: process.env.SITE_URL || undefined,
  // GitHub Pages serves this repo under /agentic-readiness/. The deploy workflow sets BASE_PATH;
  // local dev and Vercel leave it unset and serve from /.
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  redirects: { '/readiness': '/en/readiness/' },
  devToolbar: { enabled: false },
});
