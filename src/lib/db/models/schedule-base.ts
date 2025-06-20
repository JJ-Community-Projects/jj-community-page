import type {InferSelectModel} from "drizzle-orm";
import {schedulesTable, streamsTable} from "../schema/schema.ts";
import type {DetailedStream} from "./schedule-ui.ts";

/**
 * Type for a basic schedule
 */
export type Schedule = InferSelectModel<typeof schedulesTable>;

/**
 * Type for a schedule with its streams
 */
export type ScheduleWithStreams = {
  schedule: Schedule,
  streams: InferSelectModel<typeof streamsTable>[]
}

/**
 * Type for a schedule with detailed streams
 */
export type ScheduleWithDetailedStreams = {
  schedule: Schedule,
  streams: DetailedStream[]
}
