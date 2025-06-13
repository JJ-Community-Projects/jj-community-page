import {DateTime} from "luxon";

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
  // Get the day of the week. 1 is Monday and 7 is Sunday
  const jjStartWeekday = jjStart.weekday
  const map: Record<number, number> = {}
  for (let i = 0; i < 7; i++) {
    const weekday = ((jjStartWeekday + i) % 7) + 1
    map[weekday] = i
  }
  return map
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
