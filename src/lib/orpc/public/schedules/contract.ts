import {oc} from "@orpc/contract";
import {UserIdSchema as UserSlugSchema} from "../../schemas/users.ts";
import {FullScheduleSchema} from "../schemas/schedule.ts";
import {ScheduleInfoSchema} from "../../schemas/schedules.ts";
import z from "zod";

/**
 * Schema for input that includes both user slug and year.
 * Used for year-specific schedule queries.
 */
const UserSlugWithYearSchema = z.object({
  userSlug: UserSlugSchema,
  year: z.number().int().positive(),
});

/**
 * Contract for getting the primary schedule information for a user by their slug.
 * Returns only the basic schedule metadata without streams or participants.
 * The primary schedule is the main/featured schedule for the user's current year.
 */
const getPrimaryScheduleInfoByUserSlugContract = oc
  .input(UserSlugSchema)
  .output(ScheduleInfoSchema);

/**
 * Contract for getting the primary full schedule data for a user by their slug.
 * Returns complete schedule information including all streams, participants, and organized data.
 * The primary schedule is the main/featured schedule for the user's current year.
 */
const getPrimaryFullScheduleByUserSlugContract = oc
  .input(UserSlugSchema)
  .output(FullScheduleSchema);

/**
 * Contract for getting all schedule information entries for a user by their slug.
 * Returns an array of schedule metadata for all schedules owned by the user.
 * Does not include detailed stream data or participants.
 */
const getScheduleInfoByUserSlugContract = oc
  .input(UserSlugSchema)
  .output(z.array(ScheduleInfoSchema));

/**
 * Contract for getting all full schedule data for a user by their slug.
 * Returns an array of complete schedule information including streams and participants.
 * Includes all schedules owned by the user with their complete datasets.
 */
const getFullScheduleByUserSlugContract = oc
  .input(UserSlugSchema)
  .output(z.array(FullScheduleSchema));

/**
 * Contract for getting the primary schedule information for a user by their slug for a specific year.
 * Returns only the basic schedule metadata without streams or participants.
 * The primary schedule is the main/featured schedule for the user in the specified year.
 */
const getPrimaryScheduleInfoByUserSlugAndYearContract = oc
  .input(UserSlugWithYearSchema)
  .output(ScheduleInfoSchema);

/**
 * Contract for getting the primary full schedule data for a user by their slug for a specific year.
 * Returns complete schedule information including all streams, participants, and organized data.
 * The primary schedule is the main/featured schedule for the user in the specified year.
 */
const getPrimaryFullScheduleByUserSlugAndYearContract = oc
  .input(UserSlugWithYearSchema)
  .output(FullScheduleSchema);

/**
 * Contract for getting all schedule information entries for a user by their slug for a specific year.
 * Returns an array of schedule metadata for all schedules owned by the user in the specified year.
 * Does not include detailed stream data or participants.
 */
const getScheduleInfoByUserSlugAndYearContract = oc
  .input(UserSlugWithYearSchema)
  .output(z.array(ScheduleInfoSchema));

/**
 * Contract for getting all full schedule data for a user by their slug for a specific year.
 * Returns an array of complete schedule information including streams and participants.
 * Includes all schedules owned by the user in the specified year with their complete datasets.
 */
const getFullScheduleByUserSlugAndYearContract = oc
  .input(UserSlugWithYearSchema)
  .output(z.array(FullScheduleSchema));


export const contracts = {
  getPrimaryScheduleInfoByUserSlugContract,
  getPrimaryFullScheduleByUserSlugContract,
  getScheduleInfoByUserSlugContract,
  getFullScheduleByUserSlugContract,
  getPrimaryScheduleInfoByUserSlugAndYearContract,
  getPrimaryFullScheduleByUserSlugAndYearContract,
  getScheduleInfoByUserSlugAndYearContract,
  getFullScheduleByUserSlugAndYearContract,
}
