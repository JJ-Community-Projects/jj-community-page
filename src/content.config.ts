import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { CharitiesStaticSchema, CreatorSchema, ScheduleDaySchema, ScheduleSchema, TwitchUserSchema, } from './content/schema.ts'

const yamlLoader = (dir: string) => glob({ base: `./src/content/${dir}`, pattern: '**/*.{yaml,yml}' })

const schedules = defineCollection({
  loader: yamlLoader('schedules'),
  schema: ScheduleSchema,
})

const scheduleDays = defineCollection({
  loader: yamlLoader('scheduleDays'),
  schema: ScheduleDaySchema,
})

const creators = defineCollection({
  loader: yamlLoader('creators'),
  schema: CreatorSchema,
})

const twitchUser = defineCollection({
  loader: yamlLoader('twitchUser'),
  schema: TwitchUserSchema,
})

const faqCollection = defineCollection({
  loader: glob({ base: './src/content/faq', pattern: '**/*.md' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
  }),
})

const charitiesCollection = defineCollection({
  loader: yamlLoader('charities'),
  schema: CharitiesStaticSchema,
})

export const collections = {
  creators: creators,
  schedules: schedules,
  scheduleDays: scheduleDays,
  twitchUser: twitchUser,
  faq: faqCollection,
  charities: charitiesCollection,
}
