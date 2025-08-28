import {z} from "zod/v4";
import {UserDisplaySchema} from "./UserDisplaySchema.ts";


export const TeamSlugSchema = z.string().nonempty()

export const TeamSlugInputSchema = z.object({
  slug: TeamSlugSchema
})

export const TeamSlugWithYearInputSchema = z.object({
  slug: TeamSlugSchema,
  year: z.number().int().min(2020).max(2030)
})

export const TeamNextStreamsInputSchema = z.object({
  slug: TeamSlugSchema,
  limit: z.number().int().min(1).max(50).optional().default(10),
  unique: z.boolean().optional().default(false)
})

/**
 * Input schema for teams listing with optional query parameters
 * Supports filtering and response format customization
 */
export const TeamsListInputSchema = z.object({
  /** Include member count in response */
  includeMemberCount: z.boolean().optional()
})

export const TeamIdSchema =  z.number().int().nonnegative();

export const TeamIdInputSchema = z.object({
  teamId: TeamIdSchema
})

/**
 * Public teams contracts for retrieving team information without authentication.
 * These endpoints handle read-only operations for visible teams and their members.
 */
export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  visible: z.boolean(),
  ownerId: z.number()
});

/**
 * Schema for team information with member count statistics.
 * Extends basic team data with membership metrics for display purposes.
 */
export const TeamWithMemberCountSchema = TeamSchema.extend({
  /** Total number of members in this team */
  memberCount: z.number()
});

/**
 * Schema for team information with owner details.
 * Extends basic team data with owner identification for detailed views.
 */
export const TeamWithOwnerSchema = TeamSchema.extend({
  /** Display name of the team owner */
  ownerName: z.string(),
  /** Tiltify username of the team owner */
  ownerTiltifyName: z.string()
});


export const TeamWithOwnerOutputSchema = z.object({
  team: TeamWithOwnerSchema.nullable()
});

/**
 * Schema for user teams response.
 * Contains an array of teams that a user is a member of.
 */
export const UserTeamsResponseSchema = z.object({
  /** Array of teams that the user is a member of */
  teams: z.array(TeamSchema)
});

/**
 * Schema for team schedules output.
 * Currently returns empty array as schedules are not yet implemented for teams.
 */
export const TeamSchedulesOutputSchema = z.array(z.object({}));

export const TeamMembersOutputSchema = z.object({
  members: z.array(UserDisplaySchema),
})

export type Team = z.infer<typeof TeamSchema>
export type TeamWithMemberCount = z.infer<typeof TeamWithMemberCountSchema>
export type TeamWithOwner = z.infer<typeof TeamWithOwnerSchema>
export type TeamWithOwnerOutput = z.infer<typeof TeamWithOwnerOutputSchema>
export type UserTeamsResponse = z.infer<typeof UserTeamsResponseSchema>
export type TeamMembersOutput = z.infer<typeof TeamMembersOutputSchema>
export type TeamSchedulesOutput = z.infer<typeof TeamSchedulesOutputSchema>
