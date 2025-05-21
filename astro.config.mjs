// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.antonsten.com',
  integrations: [
    tailwind(),
    mdx(),
    netlify()
  ],
  output: 'server',
  experimental: {
    session: true
  },
  vite: {
    envDir: './'
  }
});