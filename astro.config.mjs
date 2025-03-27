// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    mdx({
      remarkPlugins: [],
      rehypePlugins: [],
      customComponents: {
        img: './src/components/MDXImage.astro'
      }
    })
  ],
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  },
  vite: {
    envDir: '.'
  }
});