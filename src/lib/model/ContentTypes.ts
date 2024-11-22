import {z} from "astro:content";
import {
  CreatorSchema,
  ScheduleDaySchema,
  ScheduleSchema,
  ScheduleWeekSchema,
  StreamBackgroundSchema,
  StreamSchema,
  TwitchUserSchema,
  VodSchema
} from "../../content/schema.ts";
import type {DateTime} from "luxon";

export type ContentScheduleDay = z.infer<typeof ScheduleDaySchema>;
export type ContentScheduleWeek = z.infer<typeof ScheduleWeekSchema>;
export type ContentStream = z.infer<typeof StreamSchema>;
export type ContentStreamBackground = z.infer<typeof StreamBackgroundSchema>;
export type ContentSchedule = z.infer<typeof ScheduleSchema>;
export type ContentCreator = z.infer<typeof CreatorSchema>;
export type ContentVod = z.infer<typeof VodSchema>;
export type ContentTwitchUser = z.infer<typeof TwitchUserSchema>;

export type FullCreator = Omit<ContentCreator, 'twitchUser'> & { twitchUser?: ContentTwitchUser, id: string };
export type FullStream = Omit<ContentStream, 'creators'> & { creators: FullCreator[], id: string };
export type FullDay = Omit<ContentScheduleDay, 'streams'> & { streams: FullStream[] };
export type FullWeek = Omit<ContentScheduleWeek, 'days'> & {
  days: FullDay[], streams: FullStream[],
};
export type FullSchedule = Omit<ContentSchedule, 'weeks'> & {
  weeks: FullWeek[],
  streams: FullStream[],
  updatedAt: DateTime,
};
