import {DateTime} from "luxon";
import {JJColors} from "../lib/JJColors.ts";

/**
 * Maps weekdays to color indices based on the start day of Jingle Jam.
 *
 * This function creates a mapping from weekdays (1-7, where 1 is Monday and 7 is Sunday)
 * to color indices (0-6). The mapping starts with the weekday of December 1st of the current year
 * (when Jingle Jam starts) and assigns it color index 0, then increments through the week.
 *
 * The purpose is to ensure consistent color assignments for weekdays in the Jingle Jam schedule,
 * regardless of which day of the week December 1st falls on in a given year.
 *
 * Examples:
 * - If jjStartWeekday is 1 (Monday):
 *   Result: {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6}
 *   Monday gets color 0, Tuesday gets color 1, etc.
 *
 * - If jjStartWeekday is 3 (Wednesday):
 *   Result: {1: 5, 2: 6, 3: 0, 4: 1, 5: 2, 6: 3, 7: 4}
 *   Wednesday gets color 0, Thursday gets color 1, etc., and Monday gets color 5
 *
 * - If jjStartWeekday is 6 (Saturday):
 *   Result: {1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0, 7: 1}
 *   Saturday gets color 0, Sunday gets color 1, etc.
 *
 * @param {DateTime} jjStart - The start of Jingle Jam
 *
 * @returns A record mapping weekdays (1-7) to color indices (0-6)
 */
export function jjDatesToColors(jjStart: DateTime): Record<number, number> {
  const jjStartWeekday = jjStart.weekday
  const result: Record<number, number> = {}

  // For all years, map each weekday to a color index
  // The JJ start day (jjStartWeekday) maps to color index 0
  // The next day maps to color index 1, and so on
  for (let i = 0; i < 7; i++) {
    // Calculate the weekday (1-7) for this offset
    // ((jjStartWeekday - 1 + i) % 7) + 1 ensures we stay in the range 1-7
    // jjStartWeekday - 1 shifts to 0-based index, then we add i, take modulo 7, and shift back to 1-based
    const weekday = ((jjStartWeekday - 1 + i) % 7) + 1

    // Map this weekday to color index i
    result[weekday] = i
  }

  return result
}
/*
export function jjDatesToColors(jjStart: DateTime): Record<number, number> {
  // Get the day of the week. 1 is Monday and 7 is Sunday
  const jjStartWeekday = jjStart.weekday
  console.log('jjDatesToColors', 'jjStartWeekday', jjStartWeekday)
  const map: Record<number, number> = {}
  for (let i = 1; i <= 7; i++) {
    const weekday = ((jjStartWeekday + i) % 7)
    map[weekday] = i
  }
  return map
}*/

/**
 * Returns the appropriate color for a stream based on its start datetime.
 *
 * This function takes a DateTime object representing the start time of a stream
 * and returns the corresponding color from the JJColors palette. The color is determined
 * by the day of the week the stream starts on, relative to the start of Jingle Jam
 * (December 1st of the same year).
 *
 * @param {DateTime} streamStart - The start datetime of the stream
 * @param {string} shade - The color shade to use (default: '500')
 * @returns {string} The hex color code for the stream
 */
export function getStreamColor(streamStart: DateTime, shade: number = 500): string {
  // Calculate December 1st of the same year (Jingle Jam start)
  const jjStart = DateTime.fromObject({ month: 12, day: 1, year: streamStart.year });

  // Get the color mapping based on Jingle Jam start day
  const colorMap = jjDatesToColors(jjStart);

  // Get the weekday of the stream start
  const weekday = streamStart.weekday;


  // Get the color index from the mapping
  const colorIndex = colorMap[weekday];

  // Return the appropriate color from JJColors
  const dayKey = `day-${colorIndex + 1}` as keyof typeof JJColors;
  return JJColors[dayKey][shade as keyof typeof JJColors[typeof dayKey]];
}

/**
 * Returns the appropriate Tailwind color class for a stream based on its start datetime.
 *
 * This function takes a DateTime object representing the start time of a stream
 * and returns the corresponding Tailwind color class. The color is determined
 * by the day of the week the stream starts on, relative to the start of Jingle Jam
 * (December 1st of the same year).
 *
 * @param {DateTime} streamStart - The start datetime of the stream
 * @param {string} shade - The color shade to use (default: '500')
 * @returns {string} The Tailwind color class for the stream (e.g., 'bg-day-1-500')
 */
export function getStreamColorTW(streamStart: DateTime, shade: string = '500'): string {
  // Calculate December 1st of the same year (Jingle Jam start)
  const jjStart = DateTime.fromObject({ month: 12, day: 1, year: streamStart.year });

  // Get the color mapping based on Jingle Jam start day
  const colorMap = jjDatesToColors(jjStart);

  // Get the weekday of the stream start
  const weekday = streamStart.weekday;

  // Get the color index from the mapping
  const colorIndex = colorMap[weekday];

  // Return the appropriate Tailwind color class
  return `bg-day-${colorIndex + 1}-${shade}`;
}

/**
 * Returns the entire color palette for a stream based on its start datetime.
 *
 * This function takes a DateTime object representing the start time of a stream
 * and returns the corresponding color palette from the JJColors. The palette is determined
 * by the day of the week the stream starts on, relative to the start of Jingle Jam
 * (December 1st of the same year).
 *
 * @param {DateTime} streamStart - The start datetime of the stream
 * @returns {object} The entire color palette for the stream's day
 */
export function getStreamColors(streamStart: DateTime): typeof JJColors[keyof typeof JJColors] {
  // Calculate December 1st of the same year (Jingle Jam start)
  const jjStart = DateTime.fromObject({ month: 12, day: 1, year: streamStart.year });

  // Get the color mapping based on Jingle Jam start day
  const colorMap = jjDatesToColors(jjStart);

  // Get the weekday of the stream start
  const weekday = streamStart.weekday;

  // Get the color index from the mapping
  const colorIndex = colorMap[weekday];

  // Return the appropriate color palette from JJColors
  const dayKey = `day-${colorIndex + 1}` as keyof typeof JJColors;
  return JJColors[dayKey];
}

/*
export function jjDatesToColors(jjStart: DateTime): Record<number, number> {
  const jjStartWeekday = jjStart.weekday

  // Pre-calculate the modulo operations
  const mod1 = ((jjStartWeekday + 0) % 7) + 1
  const mod2 = ((jjStartWeekday + 1) % 7) + 1
  const mod3 = ((jjStartWeekday + 2) % 7) + 1
  const mod4 = ((jjStartWeekday + 3) % 7) + 1
  const mod5 = ((jjStartWeekday + 4) % 7) + 1
  const mod6 = ((jjStartWeekday + 5) % 7) + 1
  const mod7 = ((jjStartWeekday + 6) % 7) + 1

  return {
    [mod1]: 0,
    [mod2]: 1,
    [mod3]: 2,
    [mod4]: 3,
    [mod5]: 4,
    [mod6]: 5,
    [mod7]: 6
  }
}
 */
