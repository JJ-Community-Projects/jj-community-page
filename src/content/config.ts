import { defineCollection, z } from 'astro:content'
import { CharitiesStaticSchema, CreatorSchema, ScheduleDaySchema, ScheduleSchema, TwitchUserSchema, } from './schema.ts'
import { updateTwitchUser } from './updateTwitchUser.ts'

const schedules = defineCollection({
  type: 'data',
  schema: ScheduleSchema,
})

const scheduleDays = defineCollection({
  type: 'data',
  schema: ScheduleDaySchema,
})

const creators = defineCollection({
  type: 'data',
  schema: CreatorSchema,
})

const twitchUser = defineCollection({
  type: 'data',
  schema: TwitchUserSchema,
})

const jinglejam = defineCollection({})

const jinglejamCollection = defineCollection({})

const faqCollection = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
  }),
})

const charitiesCollection = defineCollection({
  type: 'data',
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

await updateTwitchUser()
