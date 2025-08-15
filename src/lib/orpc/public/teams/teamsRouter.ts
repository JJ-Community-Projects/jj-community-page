import { publicTeamsRouter } from './impl.ts';

/**
 * Public teams router that exports all public team-related endpoints.
 * These endpoints provide read-only access to visible team information
 * without requiring authentication.
 */
export const teamsRouter = publicTeamsRouter;
