import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error('site is not defined in astro.config.mjs');
  }

  // Ensure site URL uses www subdomain
  const siteUrl = site.toString().replace('https://antonsten.com', 'https://www.antonsten.com');

  const articles = await getCollection('articles');
  const pages = ['', 'about', 'articles'];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
    <url>
      <loc>${siteUrl}${page ? `/${page}` : ''}</loc>
      <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
      <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>
  `).join('')}
  ${articles.map(article => {
    const date = article.data.date ? new Date(article.data.date).toISOString() : new Date().toISOString();
    return `
    <url>
      <loc>${siteUrl}/articles/${article.slug}</loc>
      <lastmod>${date}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>
  `}).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}; 