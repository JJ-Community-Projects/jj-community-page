import {oc} from "@orpc/contract";
import {FullScheduleSchema, ScheduleSlugInputSchema, YearInputSchema, SchedulesListSchema} from "../schemas/schedules.ts";


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


export const contracts = {
  getFullScheduleBySlugContract,
  getVisiblePrimarySchedulesByYearContract,
}
