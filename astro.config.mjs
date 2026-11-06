import { defineConfig } from 'astro/config';

// GitHub Pages project site, matching spyhalskij/platinum-kaizo-guide.
export default defineConfig({
  site: process.env.SITE_URL || 'https://spyhalskij.github.io',
  base: process.env.BASE_PATH || '/warzone-stats/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  server: { host: true }
});
