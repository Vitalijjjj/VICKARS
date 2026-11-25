// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://vikcars-limassol.com', // client's domain (brief 2026-11-18)
  i18n: {
    locales: ['uk', 'ru', 'el'],
    defaultLocale: 'uk',
    routing: { prefixDefaultLocale: false },
  },
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },
});
