import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {RepoEnv} from "./Repo.ts";
import {ScheduleRepo} from "./ScheduleRepo.ts";
import type {InferSelectModel} from "drizzle-orm";
import {schedulesTable,} from "../schema/schema.ts";
import {DateTime} from "luxon";
import type {Day, DetailedStream, GroupedWeeks, ScheduleUIStats} from "./ScheduleModel.ts";
import type {ActionAPIContext} from "astro:actions";


export class ScheduleUIRepo {
  private db: DrizzleD1Database;
  private env: RepoEnv
  private scheduleRepo: ScheduleRepo;

  constructor(db: DrizzleD1Database, env: RepoEnv) {
    this.db = db;
    this.env = env;
    this.scheduleRepo = new ScheduleRepo(db, env);
  }
  static action(ctx: ActionAPIContext) {
    return new ScheduleUIRepo(drizzle(ctx.locals.runtime.env.DB), 'action')
  }

  /**
   * Find the next schedule for a user with a given tiltify username and format it according to the specified format
   *
   * This function formats the schedule data in three different ways:
   * - 'stream': Returns the schedule as is with a list of streams
   * - 'day': Transforms streams into days (streams grouped by the same day)
   * - 'week': Transforms days into weeks with specific date ranges:
   *   - Before Dec 1st
   *   - Dec 1-7 (Week 1)
   *   - Dec 8-14 (Week 2)
   *   - After Dec 14th
   *
   * @param tiltifyUsername - The tiltify username to find the next schedule for
   * @returns Promise resolving to the formatted schedule data
   */
  async findNextScheduleByTiltifyUsernameFormated(
    tiltifyUsername: string
  ): Promise<{
    schedule: InferSelectModel<typeof schedulesTable> | undefined,
    streams: DetailedStream[],
    days: Day[],
    weeks: GroupedWeeks,
    stats: ScheduleUIStats
  }> {
    const scheduleWithDetails = await this.scheduleRepo.findNextScheduleByTiltifyUsernameWithFullDetails(tiltifyUsername);

    // If no schedule found, return empty result with the appropriate format
    if (!scheduleWithDetails) {
      const emptyWeeks = {
        beforeJJ: {name: 'Before Jingle Jam', days: []},
        week1: {name: 'Week 1 (Dec 1-7)', days: []},
        week2: {name: 'Week 2 (Dec 8-14)', days: []},
        afterJJ: {name: 'After Jingle Jam', days: []}
      };

      return {
        schedule: undefined,
        streams: [],
        days: [],
        weeks: emptyWeeks,
        stats: this.scheduleStats(emptyWeeks)
      };
    }


    // Group streams by day first
    const daysForWeeks: Day[] = this.groupStreamsByDay(scheduleWithDetails.streams);

    // Then group days into weeks
    const weeks: GroupedWeeks = this.groupDaysIntoWeeks(daysForWeeks);

    // Calculate schedule stats
    const stats = this.scheduleStats(weeks);

    return {
      schedule: scheduleWithDetails.schedule,
      streams: scheduleWithDetails.streams,
      days: daysForWeeks,
      weeks: weeks,
      stats: stats
    };
  }

  /**
   * Groups streams by their start day
   *
   * @param streams - Array of streams to group
   * @returns Array of Day objects, each containing streams from the same day
   */
  private groupStreamsByDay(streams: DetailedStream[]): Day[] {
    // Map to store days with their streams
    const dayMap = new Map<string, Day>();

    // Group streams by day
    for (const stream of streams) {
      const startDate = new Date(stream.start);
      // Create a date string in YYYY-MM-DD format to use as a key
      const dateKey = startDate.toISOString().split('T')[0];

      if (!dayMap.has(dateKey)) {
        // Create a new day if it doesn't exist
        dayMap.set(dateKey, {
          date: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
          streams: []
        });
      }

      // Add stream to the appropriate day
      dayMap.get(dateKey)!.streams.push(stream);
    }

    // Convert map to array and sort by date
    return Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Groups days into weeks based on specific date ranges for Jingle Jam
   *
   * @param days - Array of Day objects to group into weeks
   * @returns Object with keys beforeJJ, week1, week2, and afterJJ
   */
  private groupDaysIntoWeeks(days: Day[]): GroupedWeeks {
    // Define the date ranges for weeks
    const currentYear = new Date().getFullYear();
    const dec1 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 1
    }) // new Date(new Date().getFullYear(), 11, 1); // December 1st
    const dec8 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 8
    }) // new Date(new Date().getFullYear(), 11, 8); // December 8th
    const dec15 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 15
    }) // new Date(new Date().getFullYear(), 11, 15); // December 15th

    // Initialize grouped weeks object
    const groupedWeeks: GroupedWeeks = {
      beforeJJ: {name: 'Before Jingle Jam', days: []},
      week1: {name: 'Week 1 (Dec 1-7)', days: []},
      week2: {name: 'Week 2 (Dec 8-14)', days: []},
      afterJJ: {name: 'After Jingle Jam', days: []}
    };

    // Group days into weeks
    for (const day of days) {
      const dayDate = DateTime.fromJSDate(day.date)
      if (dayDate < dec1) {
        groupedWeeks.beforeJJ.days.push(day); // Before Dec 1st
      } else if (dayDate < dec8) {
        groupedWeeks.week1.days.push(day); // Dec 1-7
      } else if (dayDate < dec15) {
        groupedWeeks.week2.days.push(day); // Dec 8-14
      } else {
        groupedWeeks.afterJJ.days.push(day); // After Dec 14th
      }
    }

    // Sort days within each week
    groupedWeeks.beforeJJ.days.sort((a, b) => a.date.getTime() - b.date.getTime());
    groupedWeeks.week1.days.sort((a, b) => a.date.getTime() - b.date.getTime());
    groupedWeeks.week2.days.sort((a, b) => a.date.getTime() - b.date.getTime());
    groupedWeeks.afterJJ.days.sort((a, b) => a.date.getTime() - b.date.getTime());

    return groupedWeeks;
  }



  /**
   * Calculate statistics for a schedule
   *
   * @param weeks - GroupedWeeks object containing the schedule data
   * @returns Object with the following schedule statistics:
   *   - weeksWithDays: Number of weeks (beforeJJ, week1, week2, afterJJ) that contain at least one day with streams
   *   - daysWithStreams: Total number of days across all weeks that have at least one stream scheduled
   *   - maxStreamsInDay: Maximum number of streams scheduled on any single day across the entire schedule
   *   - minStreamsInDay: Minimum number of streams scheduled on any day that has at least one stream
   *   - numberOfSteams: Total count of all streams across the entire schedule
   *   - averageStreamsPerDay: Average number of streams per day (helps determine how dense the schedule is)
   *   - totalStreamDuration: Total duration of all streams in hours
   *   - averageStreamDuration: Average duration of streams in minutes
   *   - streamsPerWeek: Object showing the number of streams in each week
   *   - daysPerWeek: Object showing the number of days with streams in each week
   *   - mostActiveWeek: The week with the most streams (could be highlighted in UI)
   *   - streamsByVisibility: Count of visible vs. non-visible streams
   *   - hasMultiDayStreams: Boolean indicating if any streams span multiple days
   */
  private scheduleStats(weeks: GroupedWeeks): ScheduleUIStats {
    // Count weeks with days - a week counts if it has at least one day with streams
    const weeksWithDays = Object.values(weeks).filter(week => week.days.length > 0).length;

    // Get all days with streams - flattens the days arrays from all weeks into a single array
    const allDays = Object.values(weeks).flatMap(week => week.days);
    const daysWithStreams = allDays.length;

    // If there are no days with streams, return zeros for min/max
    if (daysWithStreams === 0) {
      return {
        weeksWithDays,        // Number of weeks with at least one day (will be 0)
        daysWithStreams,      // Number of days with streams (will be 0)
        maxStreamsInDay: 0,   // Maximum streams in a day (0 since no days have streams)
        minStreamsInDay: 0,   // Minimum streams in a day (0 since no days have streams)
        numberOfSteams: 0,    // Total number of streams (0 since no streams exist)
        averageStreamsPerDay: 0,
        totalStreamDuration: 0,
        averageStreamDuration: 0,
        streamsPerWeek: {
          beforeJJ: 0,
          week1: 0,
          week2: 0,
          afterJJ: 0
        },
        daysPerWeek: {
          beforeJJ: 0,
          week1: 0,
          week2: 0,
          afterJJ: 0
        },
        mostActiveWeek: "none",
        streamsByVisibility: {
          visible: 0,
          notVisible: 0
        },
        hasMultiDayStreams: false
      };
    }

    // Calculate max and min streams in a day
    // First map each day to its stream count, then find max and min values
    const streamCounts = allDays.map(day => day.streams.length);
    const maxStreamsInDay = Math.max(...streamCounts);  // Highest number of streams on any single day
    const minStreamsInDay = Math.min(...streamCounts);  // Lowest number of streams on any day with streams

    // Calculate total number of streams by summing all stream counts
    const numberOfSteams = streamCounts.reduce((a,b) => a + b, 0);

    // Calculate average streams per day
    const averageStreamsPerDay = numberOfSteams / daysWithStreams;

    // Get all streams in a flat array
    const allStreams = allDays.flatMap(day => day.streams);

    // Calculate total stream duration in hours
    const totalStreamDuration = allStreams.reduce((total, stream) => {
      const start = new Date(stream.start);
      const end = new Date(stream.end);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + durationHours;
    }, 0);

    // Calculate average stream duration in minutes
    const averageStreamDuration = (totalStreamDuration * 60) / numberOfSteams;

    // Count streams per week
    const streamsPerWeek = {
      beforeJJ: weeks.beforeJJ.days.flatMap(day => day.streams).length,
      week1: weeks.week1.days.flatMap(day => day.streams).length,
      week2: weeks.week2.days.flatMap(day => day.streams).length,
      afterJJ: weeks.afterJJ.days.flatMap(day => day.streams).length
    };

    // Count days per week
    const daysPerWeek = {
      beforeJJ: weeks.beforeJJ.days.length,
      week1: weeks.week1.days.length,
      week2: weeks.week2.days.length,
      afterJJ: weeks.afterJJ.days.length
    };

    // Determine most active week
    const weekEntries = Object.entries(streamsPerWeek);
    const mostActiveWeekEntry = weekEntries.reduce(
      (max, [week, count]) => count > max[1] ? [week, count] : max,
      ["none", 0]
    );
    const mostActiveWeek = mostActiveWeekEntry[0];

    // Count streams by visibility
    const streamsByVisibility = {
      visible: allStreams.filter(stream => stream.visible).length,
      notVisible: allStreams.filter(stream => !stream.visible).length
    };

    // Check if any streams span multiple days
    const hasMultiDayStreams = allStreams.some(stream => {
      const startDate = new Date(stream.start);
      const endDate = new Date(stream.end);
      return startDate.getDate() !== endDate.getDate() ||
             startDate.getMonth() !== endDate.getMonth() ||
             startDate.getFullYear() !== endDate.getFullYear();
    });

    return {
      weeksWithDays,      // Number of weeks that have at least one day with streams
      daysWithStreams,    // Total count of days that have streams scheduled
      maxStreamsInDay,    // Maximum number of streams scheduled on any single day
      minStreamsInDay,    // Minimum number of streams on any day that has streams
      numberOfSteams,     // Total count of all streams across the entire schedule
      averageStreamsPerDay,
      totalStreamDuration,
      averageStreamDuration,
      streamsPerWeek,
      daysPerWeek,
      mostActiveWeek,
      streamsByVisibility,
      hasMultiDayStreams
    };
  }
}
