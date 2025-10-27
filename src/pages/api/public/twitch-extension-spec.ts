import type { APIRoute } from 'astro'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { publicRouter } from '../../../lib/orpc/public/publicRouter.ts'
import { OpenAPIGenerator } from '@orpc/openapi'
import {
  CreatorSchema,
  CurrenciesSchema,
  ExtensionConfigSchema,
  JJCampaignSchema,
  JJCampaignsSchema,
  JJCauseSchema,
  JJLivestreamSchema,
  JJRaisedSchema,
  JJUserSchema,
  StreamSchema,
  UserExtensionConfigSchema,
} from '../../../lib/orpc/public/twitchExtension/contract.ts'
import { UserDisplaySchema } from '../../../lib/orpc/public/schemas/UserDisplaySchema.ts'

export const ALL: APIRoute = async () => {
  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  })

  const spec = await generator.generate(publicRouter, {
    info: {
      title: 'Jingle Jam Community Page Public API',
      version: '0.0.1',
    },
    servers: [
      {
        description: 'Dev',
        url: 'http://localhost:3000/api/public',
      },
      {
        description: 'Beta',
        url: 'https://beta.jinglejam.ostof.dev/api/public',
      },
      {
        description: 'Prod',
        url: 'https://jinglejam.ostof.dev/api/public',
      },
    ],
    commonSchemas: {
      // Twitch Extension related Schemas (only from contract.ts or its imports)
      JJRaised: { schema: JJRaisedSchema },
      JJCause: { schema: JJCauseSchema },
      JJLivestream: { schema: JJLivestreamSchema },
      JJUser: { schema: JJUserSchema },
      JJCampaign: { schema: JJCampaignSchema },
      JJCampaigns: { schema: JJCampaignsSchema },
      Creator: { schema: CreatorSchema },
      Stream: { schema: StreamSchema },
      ExtensionConfig: { schema: ExtensionConfigSchema },
      UserExtensionConfig: { schema: UserExtensionConfigSchema },
      CurrenciesSchema: { schema: CurrenciesSchema },

      // Imported in contract.ts
      UserDisplay: { schema: UserDisplaySchema },
    },
    filter: (v) => {
      console.log(v.path)
      return v.path.includes('twitchExtension')
    },
  })
  return new Response(JSON.stringify(spec), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
