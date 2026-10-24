import { oc } from '@orpc/contract'
import {
  FullScheduleSchema,
  ScheduleSlugInputSchema,
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

export const contracts = {
  getFullScheduleBySlugContract,
}
