// src/lib/models.ts
import {editorsTable, schedulesTable, streamsTable} from "./schema/schema.ts";
import type {DrizzleD1Database} from "drizzle-orm/d1";
import {eq} from "drizzle-orm";

export type Schedule = typeof schedulesTable.$inferSelect;
export type ScheduleInsert = typeof schedulesTable.$inferInsert;
export type Editor = typeof editorsTable.$inferSelect;
export type Stream = typeof streamsTable.$inferSelect;
type Version = {
  version?: number
}
export type ScheduleEditor = {
  schedule:  Omit<Schedule, 'ownerId' | "id" | "createdAt" | "updatedAt" | "year">
  streams: Omit<Stream, 'scheduleId' | 'streamId'>[]
  editors: Editor[]
}

export type ScheduleEditorWS = {
  schedule: ScheduleEditor['schedule'];
  streams: (ScheduleEditor['streams'][0])[]
  editors: (ScheduleEditor['editors'][0])[]
}
