import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        publishDate: z.string(),
        minutesToRead: z.number().optional(),
        layout: z.string().optional()
    })
});

export const collections = {
    'articles': articles
}; 