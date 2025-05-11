import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  
  return rss({
    title: 'Anton Sten',
    description: 'Articles about design, UX, and product development',
    site: context.site,
    items: articles.map(article => ({
      title: article.data.title,
      pubDate: article.data.date,
      description: article.data.description,
      link: `/articles/${article.slug}/`,
      content: article.body,
      author: 'Anton Sten',
      categories: article.data.tags || [],
    })),
  });
} 