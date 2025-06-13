import {ActionError, defineAction} from "astro:actions";
import {z} from 'astro:schema';
import {getDB} from "../lib/db/db.ts";
import {editorsTable, schedulesTable, streamsTable} from "../lib/db/schema/schema.ts";
import {and, eq} from "drizzle-orm";
import type {ScheduleInsert} from "../lib/db/dbModels.ts";


export const tiltify = {
  getUserById: defineAction({
    input: z.string(),
    handler:(input, ctx)=>{

    }
  })
}
