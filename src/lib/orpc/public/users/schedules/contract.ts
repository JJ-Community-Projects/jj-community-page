import {oc} from "@orpc/contract";
import {UserSlugInputSchema} from "../../schemas/common.ts";
import {FullScheduleSchema, ScheduleInfoSchema, UserSlugWithYearSchema} from "../../schemas/schedules.ts";
import {z} from "zod/v4";

/**
 * Contract for getting the primary schedule information for a user by their slug.
 * Returns only the basic schedule metadata without streams or participants.
 * The primary schedule is the main/featured schedule for the user's current year.
 */
const getPrimaryScheduleInfoByUserSlugContract = oc
  .input(UserSlugInputSchema)
  .output(ScheduleInfoSchema)
  .route({
    path: '/users/{slug}/schedules/primary',
    method: 'GET',
    operationId: 'getPrimaryScheduleInfo',
    summary: 'Get primary schedule info',
    description: 'Retrieve basic schedule metadata for user\'s primary schedule',
    tags: ['schedules'],
    successDescription: 'Primary schedule info retrieved successfully',
    deprecated: false
  });

/**
 * Contract for getting the primary full schedule data for a user by their slug.
 * Returns complete schedule information including all streams, participants, and organized data.
 * The primary schedule is the main/featured schedule for the user's current year.
 */
const getPrimaryFullScheduleByUserSlugContract = oc
  .input(UserSlugInputSchema)
  .output(FullScheduleSchema)
  .route({
    path: '/users/{slug}/schedules/primary/full',
    method: 'GET',
    operationId: 'getPrimaryFullSchedule',
    summary: 'Get primary full schedule',
    description: 'Retrieve complete schedule data for user\'s primary schedule',
    tags: ['schedules'],
    successDescription: 'Primary full schedule retrieved successfully',
    deprecated: false
  });

/**
 * Contract for getting all schedule information entries for a user by their slug.
 * Returns an array of schedule metadata for all schedules owned by the user.
 * Does not include detailed stream data or participants.
 */
const getScheduleInfoByUserSlugContract = oc
  .input(UserSlugInputSchema)
  .output(z.array(ScheduleInfoSchema))
  .route({
    path: '/users/{slug}/schedules',
    method: 'GET',
    operationId: 'getScheduleInfoByUser',
    summary: 'Get user schedule info',
    description: 'Retrieve metadata for all schedules owned by a user',
    tags: ['schedules'],
    successDescription: 'User schedule info retrieved successfully',
    deprecated: false
  });

/**
 * Contract for getting all full schedule data for a user by their slug.
 * Returns an array of complete schedule information including streams and participants.
 * Includes all schedules owned by the user with their complete datasets.
 */
const getFullScheduleByUserSlugContract = oc
  .input(UserSlugInputSchema)
  .output(z.array(FullScheduleSchema))
  .route({
    path: '/users/{slug}/schedules/full',
    method: 'GET',
    operationId: 'getFullScheduleByUser',
    summary: 'Get user full schedules',
    description: 'Retrieve complete data for all user schedules',
    tags: ['schedules'],
    successDescription: 'User full schedules retrieved successfully',
    deprecated: false
  });

/**
 * Contract for getting all schedule information entries for a user by their slug for a specific year.
 * Returns an array of schedule metadata for all schedules owned by the user in the specified year.
 * Does not include detailed stream data or participants.
 */
const getScheduleInfoByUserSlugAndYearContract = oc
  .input(UserSlugWithYearSchema)
  .output(z.array(ScheduleInfoSchema))
  .route({
    path: '/users/{slug}/schedules/year/{year}',
    method: 'GET',
    operationId: 'getScheduleInfoByYear',
    summary: 'Get schedule info by year',
    description: 'Retrieve schedule metadata for specific year',
    tags: ['schedules'],
    successDescription: 'Schedule info by year retrieved successfully',
    deprecated: false
  });

/**
 * Contract for getting all full schedule data for a user by their slug for a specific year.
 * Returns an array of complete schedule information including streams and participants.
 * Includes all schedules owned by the user in the specified year with their complete datasets.
 */
const getFullScheduleByUserSlugAndYearContract = oc
  .input(UserSlugWithYearSchema)
  .output(z.array(FullScheduleSchema))
  .route({
    path: '/users/{slug}/schedules/full/year/{year}',
    method: 'GET',
    operationId: 'getFullScheduleByYear',
    summary: 'Get full schedules by year',
    description: 'Retrieve complete schedule data for specific year',
    tags: ['schedules'],
    successDescription: 'Full schedules by year retrieved successfully',
    deprecated: false
  });



export const usersSchedulesContracts = {
  getPrimaryScheduleInfoByUserSlugContract,
  getPrimaryFullScheduleByUserSlugContract,
  getScheduleInfoByUserSlugContract,
  getFullScheduleByUserSlugContract,
  getScheduleInfoByUserSlugAndYearContract,
  getFullScheduleByUserSlugAndYearContract
}
