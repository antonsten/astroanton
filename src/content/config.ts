import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.union([z.date(), z.string(), z.string().transform(str => new Date(str))]).optional(),
        readingTime: z.union([z.number(), z.string(), z.string().transform(str => parseInt(str, 10))]).optional(),
        layout: z.string().optional()
    })
});

export const collections = {
    'articles': articles
}; 