import {defineCollection} from 'astro:content';
import {CreatorSchema, ScheduleDaySchema, ScheduleSchema, TwitchUserSchema} from "./schema.ts";
import {updateTwitchUser} from "./updateTwitchUser.ts";
import {reference, z} from "astro:content";

const schedules = defineCollection({
  type: 'data',
  schema: ScheduleSchema
})

const scheduleDays = defineCollection({
  type: 'data',
  schema: ScheduleDaySchema
})

const creators = defineCollection({
  type: 'data',
  schema: CreatorSchema
})

const twitchUser = defineCollection({
  type: 'data',
  schema: TwitchUserSchema
})

const jinglejam = defineCollection(
  {}
)

const jinglejamCollection = defineCollection({

})

const faqCollection = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
  }),
})

export const collections = {
  'creators': creators,
  'schedules': schedules,
  'scheduleDays': scheduleDays,
  'twitchUser': twitchUser,
  'faq': faqCollection,
};

await updateTwitchUser()
