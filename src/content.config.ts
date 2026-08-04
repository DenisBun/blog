import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
  message: 'Must be an http or https URL',
});

const articles = defineCollection({
  loader: glob({ pattern: ['**/[^_]**.md'], base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      publishDate: z.date(),
      updateDate: z.date().optional(),
      draft: z.boolean().optional(),
      featured: z.boolean().optional(),
      llmsTxt: z.boolean().optional(),
      slug: z.string().optional(),
      i18nSlug: z.record(z.string(), z.string()).optional(),
      externalCanonical: httpUrl.optional(),
      title: z.string(),
      excerpt: z.string().optional(),
      image: z
        .object({
          file: image().optional(),
          url: httpUrl.optional(),
          alt: z.string().optional(),
        })
        .optional(),
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      author: z
        .object({
          name: z.string(),
          url: httpUrl.optional(),
        })
        .optional(),
      tocDepth: z.number().optional(),
      url: z.string().optional(),
    }),
});

export const collections = { articles };
