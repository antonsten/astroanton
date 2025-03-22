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
      components: {
        img: './src/components/MDXImage.astro'
      }
    })
  ],
  output: 'static',
  base: '/my-website',
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
});