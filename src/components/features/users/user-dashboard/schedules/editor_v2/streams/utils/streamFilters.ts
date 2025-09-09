import { sameDay } from "./dateUtils";

export type MinimalStream = {
  id: number;
  title: string;
  visible: boolean;
  start: Date | string;
  end: Date | string;
};

export const byDay = <T extends MinimalStream>(streams: T[], date: Date | string) => {
  return streams.filter((s) => sameDay(s.start, date));
};

export const sortByStart = <T extends MinimalStream>(streams: T[]) => {
  return [...streams].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};
