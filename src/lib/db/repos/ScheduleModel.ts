import type {Prettify} from "../../Prettify.ts";
import type {InferSelectModel} from "drizzle-orm";
import {streamParticipantsTable, streamsTable, streamTagsTable} from "../schema/schema.ts";

export type DetailedStream = Prettify<Prettify<InferSelectModel<typeof streamsTable>> & {
  tags: Prettify<InferSelectModel<typeof streamTagsTable>>[],
  participants: Prettify<InferSelectModel<typeof streamParticipantsTable>>[]
}>

/**
 * Type definition for a day containing streams that occur on the same day
 */
export type Day = {
  date: Date;
  streams: DetailedStream[];
};

/**
 * Type definition for a week containing days
 */
export type Week = {
  name: string;
  days: Day[];
};


/**
 * Type definition for grouped weeks object
 */
export type GroupedWeeks = {
  beforeJJ: Week;
  week1: Week;
  week2: Week;
  afterJJ: Week;
};

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
