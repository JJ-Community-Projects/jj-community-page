import { privateSchedulesRouter } from './impl.ts';

/**
 * Private schedules router that exports all authenticated schedule management endpoints.
 * These endpoints require authentication and handle schedule CRUD operations,
 * visibility management, tag operations, and query operations.
 */
export const schedulesRouter = privateSchedulesRouter;
