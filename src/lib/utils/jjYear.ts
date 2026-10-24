import { DateTime } from 'luxon'

/** The year of the next (or running) Jingle Jam. Same rule as useNextJJStartDate: from 15 Dec (London) it is next year's. */
export function nextJJYear(now: DateTime = DateTime.now()): number {
  const london = now.setZone('Europe/London')
  return london.month === 12 && london.day >= 15 ? london.year + 1 : london.year
}

/**
 * The Jingle Jam year a page is about. While the event content is shown that is the configured year
 * (`web:config.year`); otherwise the upcoming Jingle Jam, as the configured year can still be last year's.
 */
export function upcomingJJYear(
  configYear: number,
  contentHidden: boolean,
  now?: DateTime,
): number {
  return contentHidden ? Math.max(configYear, nextJJYear(now)) : configYear
}
