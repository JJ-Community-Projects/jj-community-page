import type {DateTime} from "luxon";
import type {InferSelectModel} from "drizzle-orm";
import {streamsTable} from "../schema/schema.ts";
import type {Prettify} from "../../Prettify.ts";
import type {Schedule} from "./schedule-base.ts";

/**
 * Type for a stream tag
 */
export type TagUI = {
  label: string;
  tag: string
}

/**
 * Type for a stream participant
 */
export type ParticipantUI = {
  tiltifyName: string,
  label: string,
  id: number,
  img?: string
}

/**
 * Type for a stream with detailed information including tags and participants
 */
export type DetailedStream = Prettify<Prettify<InferSelectModel<typeof streamsTable>> & {
  tags: TagUI[],
  participants: ParticipantUI[]
}>

/**
 * Type definition for a day containing streams that occur on the same day
 */
export type ScheduleDayUI = {
  date: Date;
  streams: DetailedStream[];
};

/**
 * Type definition for time information in a schedule
 */
export type ScheduleUITime = {
  start: {
    hours: number;
    minutes: number;
  },
  end: {
    hours: number;
    minutes: number;
  }
  timezone: string;
}

/**
 * Type definition for a week containing days
 */
export type ScheduleWeekUI = {
  name: string;
  days: ScheduleDayUI[];
  start: Date;
  end: Date;
  times?: ScheduleUITime[]
};

/**
 * Type definition for grouped weeks object
 */
export type ScheduleGroupedWeeks = {
  beforeJJ: ScheduleWeekUI;
  week1: ScheduleWeekUI;
  week2: ScheduleWeekUI;
  afterJJ: ScheduleWeekUI;
};

/**
 * Type definition for schedule statistics
 */
export type ScheduleUIStats = {
  weeksWithDays: number;    // Number of weeks that have at least one day with streams
  daysWithStreams: number;  // Total number of days that have streams scheduled
  maxStreamsInDay: number;  // Maximum number of streams on any single day
  minStreamsInDay: number;  // Minimum number of streams on any day (that has at least one stream)
  numberOfSteams: number;   // Total count of all streams across the entire schedule
  averageStreamsPerDay: number; // Average number of streams per day
  totalStreamDuration: number; // Total duration of all streams in hours
  averageStreamDuration: number; // Average duration of streams in minutes
  streamsPerWeek: { // Number of streams in each week
    beforeJJ: number;
    week1: number;
    week2: number;
    afterJJ: number;
  };
  daysPerWeek: { // Number of days with streams in each week
    beforeJJ: number;
    week1: number;
    week2: number;
    afterJJ: number;
  };
  mostActiveWeek: string; // The week with the most streams
  streamsByVisibility: {
    visible: number;
    notVisible: number;
  };
  hasMultiDayStreams: boolean; // Whether any streams span multiple days
}

/**
 * Type definition for the complete UI representation of a schedule
 */
export type ScheduleUI = {
  schedule: Schedule,
  streams: DetailedStream[],
  days: ScheduleDayUI[],
  weeks: ScheduleGroupedWeeks,
  stats: ScheduleUIStats
}
