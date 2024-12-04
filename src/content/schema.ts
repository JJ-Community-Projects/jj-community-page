import {reference, z} from "astro:content";
import {IANAZone} from "luxon";

const DateSchema = z.coerce.date().or(z.string().transform(v => (new Date(v))))

export const StreamBackgroundSchema = z.object({
  colors: z.array(z.string().regex(new RegExp('#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})'), 'Must be a hex color')).optional(),
  orientation: z.enum(['TD', 'LR', 'RL', 'DT', 'TLBR', 'TRBL',]).default('TD'),
})

export const VodSchema = z.object({
  type: z.enum(['youtube', 'twitch']).default('youtube'),
  label: z.string().optional(),
  link: z.string().url(),
})

export const StreamSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  start: DateSchema,
  end: DateSchema,
  creators: z.array(reference('creators')).optional(),
  vods: z.array(VodSchema).optional(),
  style: z.object({
    background: StreamBackgroundSchema.default({
      colors: ['#000000', '#ffffff'],
      orientation: 'TD'
    }),
    tileSize: z.number().default(1),
  })
})

export const ScheduleDaySchema = z.object({
  date: DateSchema,
  streams: z.array(StreamSchema),
})

export const CreatorSchema = z.object({
  name: z.string(),
  type: z.enum(['yogs', 'best_of', 'staff', 'friend']).default('yogs'),
  link: z.string().url().optional(),
  twitchUser: reference('twitchUser').optional(),
  birthdate: DateSchema.optional(),
  bio: z.string().optional(),
  links: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string().optional(),
    avatar: z.string().optional(),
  })).optional(),
  related: z.array(reference('creators')).optional(),
  profileImage: z.object({
    small: z.string().optional(),
    medium: z.string().optional(),
    large: z.string().optional(),
  }).optional(),
  style: z.object({
    primaryColor: z.string().regex(new RegExp('#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})'), 'Must be a hex color').optional(),
    secondaryColor: z.string().regex(new RegExp('#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3})'), 'Must be a hex color').optional(),
  }).optional()
})

export const TwitchUserSchema = z.object({
  id: z.string(),
  login: z.string(),
  display_name: z.string(),
  description: z.string(),
  profile_image_url: z.string(),
})

export const ScheduleWeekSchema = z.object({
  week: z.number(),
  days: z.array(reference('scheduleDays')),
})

export const ScheduleSchema = z.object({
  title: z.string().default('Schedule'),
  visible: z.boolean().default(true),
  timezone: z.string().default('Europe/London')
    .refine(v => {
      return IANAZone.isValidZone(v)
    }, 'Must be a valid IANA timezone. See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones for a list of valid timezones'),
  times: z.array(z.object({
    start: DateSchema,
    end: DateSchema,
  })),
  weeks: z.array(ScheduleWeekSchema)
})
