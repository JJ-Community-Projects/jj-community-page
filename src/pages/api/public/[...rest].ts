import type { APIRoute } from 'astro'
import { CORSPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from '@orpc/json-schema'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { publicRouter } from '../../../lib/orpc/public/publicRouter.ts'
import { onError } from '@orpc/client'
import {
  TwitchChannelSchema,
  UserPaginationSchema,
  UserProfileDataSchema,
} from '../../../lib/orpc/public/schemas/users.ts'
import {
  FullScheduleSchema,
  ScheduleInfoSchema,
  ScheduleSlugInputSchema,
  UserSlugWithYearSchema,
} from '../../../lib/orpc/public/schemas/schedules.ts'
import { TeamSchema, TeamWithMemberCountSchema, } from '../../../lib/orpc/public/schemas/teams.ts'
import { UserSlugInputSchema, UserSlugSchema, } from '../../../lib/orpc/public/schemas/common.ts'
import { UserDisplaySchema } from '../../../lib/orpc/public/schemas/UserDisplaySchema.ts'

const handler = new OpenAPIHandler(publicRouter, {
  interceptors: [
    onError((error) => {
      console.error('OpenAPIHandler', error)
      const cause = (error as any).cause
      if (cause) {
        console.error('OpenAPIHandler', cause)
        console.error('OpenAPIHandler', JSON.stringify(cause))
      }
    }),
  ],
  plugins: [
    new CORSPlugin(),
    new ResponseHeadersPlugin(),
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new OpenAPIReferencePlugin({
      docsProvider: 'swagger',
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: 'Jingle Jam Community Page Public API',
          version: '0.0.1',
        },
        commonSchemas: {
          // User Schemas
          UserSlugInputSchema: { schema: UserSlugInputSchema },

          TwitchChannel: { schema: TwitchChannelSchema },
          UserDisplay: { schema: UserDisplaySchema },
          UserSlug: { schema: UserSlugSchema },
          UserPagination: { schema: UserPaginationSchema },
          UserProfileData: { schema: UserProfileDataSchema },

          // Schedule Schemas
          ScheduleInfo: { schema: ScheduleInfoSchema },
          ScheduleSlug: { schema: ScheduleSlugInputSchema },
          UserSlugWithYear: { schema: UserSlugWithYearSchema },
          FullSchedule: { schema: FullScheduleSchema },

          // Team Schemas
          Team: { schema: TeamSchema },
          TeamWithMemberCount: { schema: TeamWithMemberCountSchema },
        },
      },
    }),
  ],
})

export const ALL: APIRoute = async (context) => {
  console.log('api/public/[...rest].ts')
  try {
    const { response } = await handler.handle(context.request, {
      prefix: '/api/public',
      context: {
        locals: context.locals,
        request: context.request,
        env: context.locals.runtime.env,
      },
    })
    return response ?? new Response('Not found', { status: 404 })
  } catch (e) {
    console.error('error', e)
  }
  return new Response('Not found', { status: 404 })
}
