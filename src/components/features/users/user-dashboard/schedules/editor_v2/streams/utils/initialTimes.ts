import { byDay, type MinimalStream } from "./streamFilters";

// Return the stream with the greatest end time.
// Tie-breakers: greatest start time, then greatest id.
export const latestByEnd = <T extends MinimalStream>(streams: T[]): T | undefined => {
  let best: T | undefined = undefined;
  for (const s of streams) {
    if (!s || !s.end) continue;
    const end = new Date(s.end).getTime();
    const start = new Date(s.start).getTime();
    if (!isFinite(end) || !isFinite(start)) continue;

    if (!best) {
      best = s;
      continue;
    }
    const bestEnd = new Date(best.end).getTime();
    const bestStart = new Date(best.start).getTime();

    if (end > bestEnd) {
      best = s;
    } else if (end === bestEnd) {
      if (start > bestStart) {
        best = s;
      } else if (start === bestStart) {
        const id = (s as any).id ?? 0;
        const bestId = (best as any).id ?? 0;
        if (id > bestId) best = s;
      }
    }
  }
  return best;
};

export const latestByEndOnDay = <T extends MinimalStream>(streams: T[], date: Date): T | undefined => {
  return latestByEnd(byDay(streams, date));
};

export const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 60 * 60 * 1000);

export const makeDayFallback = (year: number, date: Date) => new Date(year, 11, date.getDate(), 18, 0, 0, 0);

export const makeEmptyScheduleFallback = (year: number) => new Date(year, 11, 15, 18, 0, 0, 0);
