// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Optional: set SITE_URL at deploy time. Pages are noindex, so no canonical URLs are emitted.
  site: process.env.SITE_URL || undefined,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  redirects: { '/readiness': '/en/readiness/' },
  devToolbar: { enabled: false },
});
