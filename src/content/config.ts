import {defineCollection} from 'astro:content';
import {CreatorSchema, ScheduleDaySchema, ScheduleSchema, TwitchUserSchema} from "./schema.ts";
import {updateTwitchUser} from "./updateTwitchUser.ts";

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

export const collections = {
  'creators': creators,
  'schedules': schedules,
  'scheduleDays': scheduleDays,
  'twitchUser': twitchUser,
};

await updateTwitchUser()
