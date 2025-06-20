import type {
  ScheduleDayUI,
  ScheduleGroupedWeeks,
  ScheduleUI,
  ScheduleUIStats,
  ScheduleUITime,
  ScheduleWeekUI,
  DetailedStream,
  ParticipantUI,
  TagUI
} from "../lib/db/models/schedule-ui.ts";
import {DateTime} from "luxon";
import {loadScheduleFromContent} from "../content/loadScheduleFromContent.ts";
import type {FullStream} from "../lib/model/ContentTypes.ts";


/**
 * Converts a string to a numeric hash value using a modified FNV-1a algorithm.
 *
 * This function generates a consistent numeric hash for any string input by:
 * 1. Starting with a prime number as the hash basis
 * 2. For each character in the string:
 *    - Multiplying the current hash by another prime (FNV prime)
 *    - XORing the result with the character code
 * 3. Taking the modulo with a large prime to keep the result within JavaScript's safe integer range
 *
 * Advantages over the previous implementation:
 * - Works reliably with strings of any length
 * - Produces consistent results within JavaScript's number range
 * - Has good distribution properties (minimizes collisions)
 * - the Same string always produces the same number
 *
 * @param s - The input string to convert
 * @returns A numeric hash representation of the input string
 */
function stringToNumber(s: string): number {
  if (!s) return 0;

  // Use FNV-1a hash algorithm with modifications to fit within JavaScript's safe integer range
  const PRIME = 16777619;
  const OFFSET_BASIS = 2166136261;
  const MOD = 2147483647; // Use a large prime to reduce collisions while staying within safe integer range

  let hash = OFFSET_BASIS;
  for (let i = 0; i < s.length; i++) {
    // Multiply by prime (using bitwise operations for better performance)
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, PRIME);
  }

  // Ensure result is positive and within safe integer range
  return Math.abs(hash % MOD);
}


function yogsFullStreamToDetailedStream(stream: FullStream): DetailedStream {
  // Convert creators to participants
  const participants: ParticipantUI[] = stream.creators.map((creator, index) => ({
    tiltifyName: '',
    label: creator.name,
    id: stringToNumber(creator.id),
    img: creator.twitchUser?.profile_image_url || creator.profileImage?.small || ''
  }));

  // Create a DetailedStream object
  const start = DateTime.fromJSDate(stream.start)
    .setZone('utc')
    .set({
      year: 2025
    })
  const end = DateTime.fromJSDate(stream.end)
    .setZone('utc')
    .set({
      year: 2025
    })
  return {
    id: parseInt(stream.id) || 0,
    scheduleId: 1, // Default schedule ID
    createdBy: 1, // Default creator ID
    title: stream.title,
    visible: true,
    subtitle: stream.subtitle || null,
    description: stream.description || stream.markdownDescription || null,
    start: start.toJSDate()!,
    end: end.toJSDate()!,
    tags: [], // Default empty tags array
    participants: participants,
    youtubeVodUrl: stream.vods?.find((v) => v.type === 'youtube')?.link ?? null,
    twitchVodUrl: stream.vods?.find((v) => v.type === 'twitch')?.link ?? null,
  };
}


/**
 * Returns the Yogs jingle jam schedule in the new schedule format
 * src/content/scheduleDays/2024
 */
export async function fullJJExampleSchedule(): Promise<ScheduleUI> {
  const fullSchedule = await loadScheduleFromContent('2024')

  // Convert streams from fullSchedule to DetailedStream format
  const streams: DetailedStream[] = fullSchedule?.streams.map(stream =>
    yogsFullStreamToDetailedStream(stream)
  ) || [];

  // Group streams by day
  const days = groupStreamsByDay(streams);

  // Group days into weeks
  const weeks = groupDaysIntoWeeks(days);

  // Calculate statistics
  const stats = calculateStats(weeks);

  // Return the ScheduleUI object
  return {
    schedule: {
      id: 1,
      title: "Jingle Jam 2025",
      slug: "jingle-jam-2025",
      year: 2025,
      visible: true,
      ownerId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    streams,
    days,
    weeks,
    stats
  };
}

/**
 * Groups streams by their start day
 */
function groupStreamsByDay(streams: DetailedStream[]): ScheduleDayUI[] {
  // Map to store days with their streams
  const dayMap = new Map<string, ScheduleDayUI>();

  // Group streams by day
  for (const stream of streams) {
    const startDate = DateTime.fromJSDate(stream.start).setZone('utc');
    // Create a date string in YYYY-MM-DD format to use as a key
    const dateKey = startDate.toISODate()!;

    if (!dayMap.has(dateKey)) {
      // Create a new day if it doesn't exist
      dayMap.set(dateKey, {
        date: startDate.startOf('day'),
        streams: []
      });
    }

    // Add stream to the appropriate day
    dayMap.get(dateKey)!.streams.push(stream);
  }

  // Convert map to array and sort by date
  return Array.from(dayMap.values()).sort((a, b) => a.date.toMillis() - b.date.toMillis());
}

/**
 * Finds common time patterns across days in a schedule
 *
 * This function analyzes the start and end times of streams across multiple days
 * and identifies patterns where streams start and end at similar times.
 *
 * @param days - Array of ScheduleDayUI objects to analyze
 * @param toleranceMinutes - Tolerance in minutes for considering times as similar (default: 10)
 * @returns Array of ScheduleUITime objects with common start and end times
 */
function findCommonTimePatterns(days: ScheduleDayUI[], toleranceMinutes: number = 10): ScheduleUITime[] {
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

/**
 * Groups days into weeks based on specific date ranges for Jingle Jam
 */
function groupDaysIntoWeeks(days: ScheduleDayUI[]): ScheduleGroupedWeeks {
  // Define the date ranges for weeks
  const currentYear = 2025; // Hard-coded for the example
  const dec1 = DateTime.fromObject({
    year: currentYear,
    month: 12,
    day: 1
  }, {zone: 'utc'});
  const dec8 = DateTime.fromObject({
    year: currentYear,
    month: 12,
    day: 8
  }, {zone: 'utc'});
  const dec15 = DateTime.fromObject({
    year: currentYear,
    month: 12,
    day: 15
  }, {zone: 'utc'});

  // Initialize grouped weeks object
  const groupedWeeks: ScheduleGroupedWeeks = {
    beforeJJ: {
      name: 'Before Jingle Jam',
      days: [],
      start: DateTime.fromObject({year: currentYear, month: 1, day: 1}, {zone: 'utc'}),
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
      end: DateTime.fromObject({year: currentYear, month: 12, day: 31}, {zone: 'utc'})
    }
  };

  // Create a map of existing days for quick lookup
  const dayMap = new Map<string, ScheduleDayUI>();
  for (const day of days) {
    const dateKey = day.date.toISODate()!;
    dayMap.set(dateKey, day);
  }

  // Group days into weeks
  for (const day of days) {
    // day.date is already a DateTime object now
    const dayDate = day.date;
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

  // Ensure week1 has all 7 days (Dec 1-7)
  ensureFullWeek(groupedWeeks.week1, dec1, 7, dayMap);

  // Ensure week2 has all 7 days (Dec 8-14)
  ensureFullWeek(groupedWeeks.week2, dec8, 7, dayMap);

  // Sort days within each week
  groupedWeeks.beforeJJ.days.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  groupedWeeks.week1.days.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  groupedWeeks.week2.days.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  groupedWeeks.afterJJ.days.sort((a, b) => a.date.toMillis() - b.date.toMillis());

  // Find common time patterns for each week and set the times attribute
  if (days.length > 0) {
    // For week1 and week2, find common time patterns
    groupedWeeks.week1.times = findCommonTimePatterns(groupedWeeks.week1.days);
    groupedWeeks.week2.times = findCommonTimePatterns(groupedWeeks.week2.days);

    // For beforeJJ and afterJJ, only set times if they have days with streams
    if (groupedWeeks.beforeJJ.days.some(day => day.streams.length > 0)) {
      groupedWeeks.beforeJJ.times = findCommonTimePatterns(groupedWeeks.beforeJJ.days);
    }

    if (groupedWeeks.afterJJ.days.some(day => day.streams.length > 0)) {
      groupedWeeks.afterJJ.times = findCommonTimePatterns(groupedWeeks.afterJJ.days);
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
function ensureFullWeek(
  week: ScheduleWeekUI,
  startDate: DateTime,
  numberOfDays: number,
  existingDays: Map<string, ScheduleDayUI>
): void {
  // Create a set of existing day dates in ISO format for quick lookup
  const existingDayDates = new Set(
    week.days.map(day => day.date.toISODate()!)
  );

  // Add placeholder days for each missing day in the week
  for (let i = 0; i < numberOfDays; i++) {
    const currentDate = startDate.plus({ days: i });
    const dateKey = currentDate.toISODate()!;

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
 */
function calculateStats(weeks: ScheduleGroupedWeeks): ScheduleUIStats {
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
  const numberOfSteams = streamCounts.reduce((a, b) => a + b, 0);

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
