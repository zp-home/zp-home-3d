import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const common = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),
  featured: z.boolean().default(false),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: common.extend({
    role: z.string(),
    status: z.string(),
    image: z.string(),
    repository: z.url(),
    website: z.url().optional(),
  }),
})

const skills = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/skills' }),
  schema: common.extend({
    kind: z.string(),
    repository: z.url().optional(),
    skillhub: z.object({
      url: z.url(),
      version: z.string(),
      downloads: z.number().int().nonnegative(),
      stars: z.number().int().nonnegative(),
      installs: z.number().int().nonnegative(),
    }).optional(),
    triggers: z.array(z.string()),
  }),
})

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: common.extend({
    readingTime: z.string(),
    reactionIssue: z.number().int().positive(),
    source: z.url().optional(),
  }),
})

export const collections = { projects, skills, knowledge }
