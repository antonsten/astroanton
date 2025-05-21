import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.union([z.date(), z.string(), z.string().transform(str => new Date(str))]).optional(),
        readingTime: z.union([z.number(), z.string(), z.string().transform(str => parseInt(str, 10))]).optional(),
        layout: z.string().optional(),
        slug: z.string().optional()
    })
});

const testimonialSchema = z.object({
    bgColor: z.string(),
    textColor: z.string().optional(),
    logo: z.string().optional(),
    quote: z.array(z.string()),
    author: z.string(),
    role: z.string()
});

const featuredWritingSchema = z.object({
    title: z.string(),
    date: z.string(),
    url: z.string(),
    icon: z.string()
});

const contactInfoSchema = z.object({
    email: z.string().email(),
    social: z.object({
        linkedin: z.string().url()
    }),
    location: z.string()
});

const coachingOptionSchema = z.object({
    title: z.string(),
    description: z.string()
});

const imageSchema = z.object({
    src: z.string(),
    alt: z.string()
});

const technologyItemSchema = z.object({
    name: z.string(),
    value: z.string(),
    url: z.string().optional()
});

const designItemSchema = z.object({
    name: z.string(),
    value: z.string(),
    url: z.string().optional()
});

const privacySchema = z.object({
    text: z.string(),
    analyticsUrl: z.string()
});

const sourceCodeSchema = z.object({
    text: z.string(),
    url: z.string()
});

const pages = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        path: z.string(),
        personSchema: z.object({
            "@context": z.string(),
            "@type": z.string(),
            name: z.string(),
            jobTitle: z.string(),
            description: z.string(),
            image: z.string(),
            url: z.string(),
            sameAs: z.array(z.string()),
            address: z.object({
                "@type": z.string(),
                addressCountry: z.string()
            }),
            worksFor: z.object({
                "@type": z.string(),
                name: z.string(),
                url: z.string()
            })
        }).optional(),
        appearances: z.array(z.object({
            title: z.string(),
            url: z.string(),
            date: z.string(),
            type: z.string()
        })).optional(),
        testimonials: z.array(testimonialSchema).optional(),
        featuredWriting: z.array(featuredWritingSchema).optional(),
        contactInfo: contactInfoSchema.optional(),
        coachingOptions: z.array(coachingOptionSchema).optional(),
        contactEmail: z.string().email().optional(),
        image: imageSchema.optional(),
        technology: z.array(technologyItemSchema).optional(),
        design: z.array(designItemSchema).optional(),
        privacy: privacySchema.optional(),
        sourceCode: sourceCodeSchema.optional()
    })
});

export const collections = {
    'articles': articles,
    'pages': pages
}; 