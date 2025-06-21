import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type {RepoEnv} from "./Repo.ts";
import {ScheduleRepo} from "./ScheduleRepo.ts";
import type {InferSelectModel} from "drizzle-orm";
import {schedulesTable,} from "../schema/schema.ts";
import {DateTime} from "luxon";
import type {Schedule, ScheduleWithDetailedStreams} from "../models/schedule-base.ts";
import type {
  DetailedStream,
  ScheduleDayUI,
  ScheduleGroupedWeeks,
  ScheduleUI,
  ScheduleUIStats,
  ScheduleUITime,
  ScheduleWeekUI, TeamScheduleUI
} from "../models/schedule-ui.ts";
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
  ): Promise<ScheduleUI | null> {
    const scheduleWithDetails = await this.scheduleRepo.findNextScheduleByTiltifyUsernameWithFullDetails(tiltifyUsername);
    return this.scheduleToScheduleUI(scheduleWithDetails);
  }

  /**
   * Find a schedule by its slug and format it as a ScheduleUI object
   *
   * This function gets a schedule by its slug and formats it according to the ScheduleUI format,
   * which includes grouping streams by days and weeks, and calculating statistics.
   *
   * @param slug - The slug of the schedule to find
   * @returns Promise resolving to the formatted schedule data
   */
  async getScheduleBySlug(
    slug: string
  ): Promise<ScheduleUI | null> {
    const scheduleWithDetails = await this.scheduleRepo.getScheduleBySlug(slug);
    if (!scheduleWithDetails) {
      return null
    }
    return this.scheduleToScheduleUI(scheduleWithDetails);
  }

  /**
   * Get the current primary schedule of a user
   * @param userId The user ID
   * @returns Promise resolving to the primary schedule as a ScheduleUI object or null if not found
   */
  async getCurrentPrimary(
    userId: number
  ): Promise<ScheduleUI | null> {
    // Get the primary schedule using the ScheduleRepo
    const primarySchedule = await this.scheduleRepo.getCurrentPrimary(userId);

    // If no primary schedule found, return null
    if (!primarySchedule) {
      return null;
    }

    // Get the schedule with detailed streams (similar to getScheduleBySlug)
    const scheduleWithDetails = await this.scheduleRepo.getScheduleBySlug(primarySchedule.slug);

    // Transform the schedule with details into a ScheduleUI object
    return this.scheduleToScheduleUI(scheduleWithDetails);
  }

  /**
   * Get the current primary schedule by its slug
   * @param slug The schedule slug
   * @returns Promise resolving to the primary schedule as a ScheduleUI object or null if not found
   */
  async getCurrentPrimaryBySlug(
    slug: string
  ): Promise<ScheduleUI | null> {
    // Get the primary schedule using the ScheduleRepo
    const primarySchedule = await this.scheduleRepo.getCurrentPrimaryBySlug(slug);

    // If no primary schedule found, return null
    if (!primarySchedule) {
      return null;
    }

    // Get the schedule with detailed streams
    const scheduleWithDetails = await this.scheduleRepo.getScheduleBySlug(primarySchedule.slug);

    // Transform the schedule with details into a ScheduleUI object
    return this.scheduleToScheduleUI(scheduleWithDetails);
  }

  /**
   * Get the current primary schedule of a user with a given tiltify username
   * @param tiltifyUsername The tiltify username
   * @returns Promise resolving to the primary schedule as a ScheduleUI object or null if not found
   */
  async getCurrentPrimaryByTiltifyUsername(
    tiltifyUsername: string
  ): Promise<ScheduleUI | null> {
    // Get the primary schedule using the ScheduleRepo
    const primarySchedule = await this.scheduleRepo.getCurrentPrimaryByTiltifyUsername(tiltifyUsername);

    // If no primary schedule found, return null
    if (!primarySchedule) {
      return null;
    }

    // Get the schedule with detailed streams
    const scheduleWithDetails = await this.scheduleRepo.getScheduleBySlug(primarySchedule.slug);

    // Transform the schedule with details into a ScheduleUI object
    return this.scheduleToScheduleUI(scheduleWithDetails);
  }

  private scheduleToScheduleUI(scheduleWithDetails?: ScheduleWithDetailedStreams | null): ScheduleUI | null {

    // If no schedule found, return empty result with the appropriate format
    if (!scheduleWithDetails) {
      return null
      /*
      const currentYear = DateTime.now().setZone('utc').year;
      const dec1 = DateTime.fromObject({
        year: currentYear,
        month: 12,
        day: 1
      }, { zone: 'utc' });
      const dec8 = DateTime.fromObject({
        year: currentYear,
        month: 12,
        day: 8
      }, { zone: 'utc' });
      const dec15 = DateTime.fromObject({
        year: currentYear,
        month: 12,
        day: 15
      }, { zone: 'utc' });

      const emptyWeeks = {
        beforeJJ: {
          name: 'Before Jingle Jam',
          days: [],
          start: DateTime.fromObject({ year: currentYear, month: 1, day: 1 }, { zone: 'utc' }),
          end: dec1
        },
        week1: {
          name: 'Week 1 (Dec 1-7)',
          days: [],
          start: dec1,
          end: dec8
        },
        week2: {
          name: 'Week 2 (Dec 8-14)',
          days: [],
          start: dec8,
          end: dec15
        },
        afterJJ: {
          name: 'After Jingle Jam',
          days: [],
          start: dec15,
          end: DateTime.fromObject({ year: currentYear, month: 12, day: 31 }, { zone: 'utc' })
        }
      };

      return {
        schedule: undefined,
        streams: [],
        days: [],
        weeks: emptyWeeks,
        stats: this.scheduleStats(emptyWeeks)
      };
      */
    }


    // Group streams by day first
    const daysForWeeks: ScheduleDayUI[] = this.groupStreamsByDay(scheduleWithDetails.streams);

    // Then group days into weeks
    const weeks: ScheduleGroupedWeeks = this.groupDaysIntoWeeks(daysForWeeks);

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
   * Find the next x upcoming streams by start time
   * @param streams - Array of streams to filter
   * @param x - Number of upcoming streams to return (default: 3)
   * @returns Array of the next x upcoming streams sorted by start time
   * @private
   */
  private nextXStreams(streams: DetailedStream[], x: number = 3): DetailedStream[] {
    const now = DateTime.now().setZone('utc');

    // Filter streams that haven't started yet
    const upcomingStreams = streams.filter(stream =>
      DateTime.fromJSDate(stream.start).setZone('utc') > now
    );

    // Sort by start time (ascending)
    const sortedStreams = upcomingStreams.sort((a, b) =>
      DateTime.fromJSDate(a.start).setZone('utc').toMillis() - DateTime.fromJSDate(b.start).setZone('utc').toMillis()
    );

    // Return the first x streams
    return sortedStreams.slice(0, x);
  }

  /**
   * Groups streams by their start day
   *
   * @param streams - Array of streams to group
   * @returns Array of Day objects, each containing streams from the same day
   */
  private groupStreamsByDay(streams: DetailedStream[]): ScheduleDayUI[] {
    // Map to store days with their streams
    const dayMap = new Map<string, ScheduleDayUI>();

    // Group streams by day
    for (const stream of streams) {
      console.log('groupStreamsByDay', 'stream.start', stream.start);
      const startDate = DateTime.fromJSDate(stream.start).setZone('utc');
      console.log('groupStreamsByDay', 'startDate', startDate);
      console.log('groupStreamsByDay', 'startDate', startDate.invalidReason);
      console.log('groupStreamsByDay', 'startDate', startDate.isValid);
      console.log('groupStreamsByDay', 'startDate', (typeof startDate));

      // Create a date string in YYYY-MM-DD format to use as a key
      const startOf = startDate.startOf('day')
      const dateKey = startOf.toISODate()!;
      console.log('groupStreamsByDay', 'dateKey', dateKey);

      if (!dayMap.has(dateKey)) {
        // Create a new day if it doesn't exist, using JS Date
        dayMap.set(dateKey, {
          date: startOf.toJSDate(), // Convert to JS Date
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
  private groupDaysIntoWeeks(days: ScheduleDayUI[]): ScheduleGroupedWeeks {
    // Define the date ranges for weeks
    const currentYear = new Date().getUTCFullYear();
    const dec1 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 1
    }, { zone: 'utc' });
    const dec8 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 8
    }, { zone: 'utc' });
    const dec15 = DateTime.fromObject({
      year: currentYear,
      month: 12,
      day: 15
    }, { zone: 'utc' });

    // Initialize grouped weeks object
    const groupedWeeks: ScheduleGroupedWeeks = {
      beforeJJ: {
        name: 'Before Jingle Jam',
        days: [],
        start: new Date(Date.UTC(currentYear, 0, 1)), // Jan 1
        end: dec1.toJSDate()
      },
      week1: {
        name: 'Week 1 (Dec 1-7)',
        days: [],
        start: dec1.toJSDate(),
        end: dec8.toJSDate()
      },
      week2: {
        name: 'Week 2 (Dec 8-14)',
        days: [],
        start: dec8.toJSDate(),
        end: dec15.toJSDate()
      },
      afterJJ: {
        name: 'After Jingle Jam',
        days: [],
        start: dec15.toJSDate(),
        end: new Date(Date.UTC(currentYear, 11, 31)) // Dec 31
      }
    };

    // Create a map of existing days for quick lookup
    const dayMap = new Map<string, ScheduleDayUI>();
    for (const day of days) {
      // Convert JS Date to DateTime temporarily for getting ISO date string
      const dateKey = DateTime.fromJSDate(day.date).toISODate()!;
      dayMap.set(dateKey, day);
    }

    // Group days into weeks
    for (const day of days) {
      const dayDate = day.date;
      const dayTime = dayDate.getTime();

      if (dayTime < groupedWeeks.week1.start.getTime()) {
        groupedWeeks.beforeJJ.days.push(day); // Before Dec 1st
      } else if (dayTime < groupedWeeks.week2.start.getTime()) {
        groupedWeeks.week1.days.push(day); // Dec 1-7
      } else if (dayTime < groupedWeeks.afterJJ.start.getTime()) {
        groupedWeeks.week2.days.push(day); // Dec 8-14
      } else {
        groupedWeeks.afterJJ.days.push(day); // After Dec 14th
      }
    }

    // Ensure week1 has all 7 days (Dec 1-7)
    this.ensureFullWeek(groupedWeeks.week1, dec1.toJSDate(), 7, dayMap);

    // Ensure week2 has all 7 days (Dec 8-14)
    this.ensureFullWeek(groupedWeeks.week2, dec8.toJSDate(), 7, dayMap);

    // Sort days within each week
    groupedWeeks.beforeJJ.days.sort((a, b) => a.date.getTime() - b.date.getTime());
    groupedWeeks.week1.days.sort((a, b) => a.date.getTime() - b.date.getTime());
    groupedWeeks.week2.days.sort((a, b) => a.date.getTime() - b.date.getTime());
    groupedWeeks.afterJJ.days.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Find common time patterns for each week and set the times attribute
    if (days.length > 0) {
      // For week1 and week2, find common time patterns
     //  groupedWeeks.week1.times = this.findCommonTimePatterns(groupedWeeks.week1.days);
      // groupedWeeks.week2.times = this.findCommonTimePatterns(groupedWeeks.week2.days);

      // For beforeJJ and afterJJ, only set times if they have days with streams
      if (groupedWeeks.beforeJJ.days.some(day => day.streams.length > 0)) {
        // groupedWeeks.beforeJJ.times = this.findCommonTimePatterns(groupedWeeks.beforeJJ.days);
      }

      if (groupedWeeks.afterJJ.days.some(day => day.streams.length > 0)) {
        // groupedWeeks.afterJJ.times = this.findCommonTimePatterns(groupedWeeks.afterJJ.days);
      }
    }

    return groupedWeeks;
  }

  /**
   * Ensures a week has the specified number of days, adding placeholder days if necessary
   *
   * @param week - The week to ensure has the full number of days
   * @param startDate - The start date of the week
   * @param numberOfDays - The number of days the week should have
   * @param existingDays - Map of existing days with streams
   */
  private ensureFullWeek(
    week: ScheduleWeekUI,
    startDate: Date,
    numberOfDays: number,
    existingDays: Map<string, ScheduleDayUI>
  ): void {
    // Create a set of existing day dates in ISO format for quick lookup
    const existingDayDates = new Set(
      week.days.map(day => DateTime.fromJSDate(day.date).toISODate()!)
    );

    // Add placeholder days for each missing day in the week
    for (let i = 0; i < numberOfDays; i++) {
      // Create a new date by adding i days to startDate
      const currentDateLuxon = DateTime.fromJSDate(startDate).plus({ days: i });
      const currentDate = currentDateLuxon.toJSDate();
      const dateKey = currentDateLuxon.toISODate()!;

      // If this date doesn't already exist in the week, add a placeholder day
      if (!existingDayDates.has(dateKey)) {
        // Check if this day exists in our map of days with streams
        if (existingDays.has(dateKey)) {
          // If it exists in our map but not in the week, add it
          week.days.push(existingDays.get(dateKey)!);
        } else {
          // Otherwise, create a placeholder day with no streams
          week.days.push({
            date: currentDate,
            streams: []
          });
        }
      }
    }
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
  private scheduleStats(weeks: ScheduleGroupedWeeks): ScheduleUIStats {
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
      const start = DateTime.fromJSDate(stream.start).setZone('utc');
      const end = DateTime.fromJSDate(stream.end).setZone('utc');
      const durationHours = end.diff(start, 'hours').hours;
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
      const startDate = DateTime.fromJSDate(stream.start).setZone('utc');
      const endDate = DateTime.fromJSDate(stream.end).setZone('utc');
      return !startDate.hasSame(endDate, 'day');
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


  private stats2(stats: ScheduleUIStats) {


  }

  /**
   * Finds common time patterns across days in a schedule
   *
   * This function analyzes the start and end times of streams across multiple days
   * and identifies patterns where streams start and end at similar times.
   *
   * @param days - Array of ScheduleDayUI objects to analyze
   * @param toleranceMinutes - Tolerance in minutes for considering times as similar (default: 10)
   * @returns Array of objects with common start and end times
   */
  private findCommonTimePatterns(days: ScheduleDayUI[], toleranceMinutes: number = 10): ScheduleUITime[] {
    if (!days || days.length === 0) {
      return [];
    }

    // Extract all start and end times from streams
    const timePatterns: Map<string, {starts: DateTime[], ends: DateTime[], count: number}> = new Map();

    // Process each day's streams
    for (const day of days) {
      for (const stream of day.streams) {
        const startTime = DateTime.fromJSDate(stream.start).setZone('utc');
        const endTime = DateTime.fromJSDate(stream.end).setZone('utc');

        // Create a key based on the time of day (hours and minutes)
        // This ignores the date part and only considers the time
        const startKey = startTime.toFormat('HH:mm');
        const endKey = endTime.toFormat('HH:mm');
        const timeKey = `${startKey}-${endKey}`;

        if (!timePatterns.has(timeKey)) {
          timePatterns.set(timeKey, {
            starts: [startTime],
            ends: [endTime],
            count: 1
          });
        } else {
          const pattern = timePatterns.get(timeKey)!;
          pattern.starts.push(startTime);
          pattern.ends.push(endTime);
          pattern.count++;
        }
      }
    }

    // Group similar time patterns (within tolerance)
    const groupedPatterns: Array<{start: string, end: string, count: number}> = [];
    const processedKeys = new Set<string>();

    for (const [key, pattern] of timePatterns.entries()) {
      if (processedKeys.has(key)) continue;

      processedKeys.add(key);
      const [startKey, endKey] = key.split('-');
      const startTime = DateTime.fromFormat(startKey, 'HH:mm', { zone: 'utc' });
      const endTime = DateTime.fromFormat(endKey, 'HH:mm', { zone: 'utc' });

      let totalCount = pattern.count;

      // Check for similar patterns within tolerance
      for (const [otherKey, otherPattern] of timePatterns.entries()) {
        if (otherKey === key || processedKeys.has(otherKey)) continue;

        const [otherStartKey, otherEndKey] = otherKey.split('-');
        const otherStartTime = DateTime.fromFormat(otherStartKey, 'HH:mm', { zone: 'utc' });
        const otherEndTime = DateTime.fromFormat(otherEndKey, 'HH:mm', { zone: 'utc' });

        // Calculate time differences in minutes
        const startDiff = Math.abs(startTime.diff(otherStartTime, 'minutes').minutes);
        const endDiff = Math.abs(endTime.diff(otherEndTime, 'minutes').minutes);

        // If both start and end times are within tolerance, consider them the same pattern
        if (startDiff <= toleranceMinutes && endDiff <= toleranceMinutes) {
          totalCount += otherPattern.count;
          processedKeys.add(otherKey);
        }
      }

      // Only include patterns that appear in multiple days (count > 1)
      if (totalCount > 1) {
        groupedPatterns.push({
          start: startKey,
          end: endKey,
          count: totalCount
        });
      }
    }

    // Sort by count (most common patterns first)
    const sortedPatterns = groupedPatterns.sort((a, b) => b.count - a.count);

    // Convert to ScheduleUITime array
    return sortedPatterns.map(pattern => {
      const [startHours, startMinutes] = pattern.start.split(':').map(Number);
      const [endHours, endMinutes] = pattern.end.split(':').map(Number);

      return {
        start: {
          hours: startHours,
          minutes: startMinutes
        },
        end: {
          hours: endHours,
          minutes: endMinutes
        },
        timezone: 'utc'
      };
    });
  }

  

  async getTeamSchedule(teamId: number): Promise<TeamScheduleUI | null> {

  }
}
