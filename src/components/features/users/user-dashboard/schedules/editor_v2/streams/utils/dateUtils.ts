import { DateTime } from "luxon";

// December weeks for Jingle Jam
// Week 1: Dec 1–7
// Week 2: Dec 8–14

export const isJJWeek1 = (d: Date | string, year: number) => {
  const dt = DateTime.fromJSDate(new Date(d));
  return dt.year === year && dt.month === 12 && dt.day >= 1 && dt.day <= 7;
};

export const isJJWeek2 = (d: Date | string, year: number) => {
  const dt = DateTime.fromJSDate(new Date(d));
  return dt.year === year && dt.month === 12 && dt.day >= 8 && dt.day <= 14;
};

export const getJJWeekDays = (year: number, weekIndex: 0 | 1) => {
  const startDay = weekIndex === 0 ? 1 : 8;
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(year, 11, startDay + i)); // month 11 = December
  }
  return days;
};

export const toDate = (year: number, month: number, day: number, hour = 0, minute = 0) => {
  // month is 1-based for ergonomics; convert to 0-based
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

export const sameDay = (a: Date | string, b: Date | string) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

export const formatTimeRange = (start: Date | string, end: Date | string) => {
  const s = DateTime.fromJSDate(new Date(start));
  const e = DateTime.fromJSDate(new Date(end));
  return `${s.toFormat("ccc d, HH:mm")} – ${e.toFormat("HH:mm")}`;
};
