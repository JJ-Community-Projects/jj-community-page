import { oc } from '@orpc/contract'
import { z } from 'zod/v4'
import {
  FullScheduleSchema,
  NextStreamsInputSchema,
  SchedulesListSchema,
  ScheduleSlugInputSchema,
  StreamSchema,
  YearInputSchema
} from '../schemas/schedules.ts'

/**
 * Get full schedule by slug
 * @path /schedules/{slug}
 * @description Retrieve complete schedule information including all streams, participants, and organized data for displaying individual schedule pages
 * @Input ScheduleSlugInputSchema - contains slug (string) to identify the schedule
 * @Output FullScheduleSchema object containing complete schedule information with all streams and participants
 */
const getFullScheduleBySlugContract = oc
  .input(ScheduleSlugInputSchema)
  .output(FullScheduleSchema)
  .route({
    path: '/schedules/{slug}',
    method: 'GET',
    operationId: 'getScheduleBySlug',
    summary: 'Get schedule by slug',
    description: 'Retrieve complete schedule information by slug',
    tags: ['schedules'],
    successDescription: 'Schedule retrieved successfully',
    deprecated: false
  });

/**
 * Get visible primary schedules by year
 * @path /schedules/year/{year}
 * @description Retrieve all visible primary schedules for a specific year for public display
 * @Input YearInputSchema - contains year (number) to filter schedules by year
 * @Output SchedulesListSchema array containing all visible primary schedules for the specified year
 */
const getVisiblePrimarySchedulesByYearContract = oc
  .input(YearInputSchema)
  .output(SchedulesListSchema)
  .route({
    path: '/schedules/year/{year}',
    method: 'GET',
    operationId: 'getVisiblePrimarySchedulesByYear',
    summary: 'Get visible primary schedules by year',
    description: 'Retrieve all visible primary schedules for a specific year',
    tags: ['schedules'],
    successDescription: 'Visible primary schedules retrieved successfully',
    deprecated: false
  });

/**
 * Get next N upcoming streams across public primary schedules for a given year.
 * @path /schedules/next-streams
 * @description Returns up to N upcoming or currently-live visible streams across all visible primary schedules for a year.
 * @Input NextStreamsInputSchema - optional year, limit, and uniqueness mode
 * @Output array of StreamSchema objects including tags and participants
 */
const getNextStreamsContract = oc
  .input(NextStreamsInputSchema)
  .output(z.array(StreamSchema))
  .route({
    path: '/schedules/next-streams',
    method: 'GET',
    operationId: 'getNextStreams',
    summary: 'Get next N streams across public primary schedules',
    description: 'Return the next N upcoming or live streams across visible primary schedules for a given year',
    tags: ['schedules'],
  });

export const contracts = {
  getFullScheduleBySlugContract,
  getVisiblePrimarySchedulesByYearContract,
  getNextStreamsContract,
}
