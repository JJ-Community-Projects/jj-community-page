import type { APIRoute } from 'astro'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { publicRouter } from '../../../lib/orpc/public/publicRouter.ts'
import { OpenAPIGenerator } from '@orpc/openapi'

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
    filter: (v) => {
      console.log(v.path)
      return v.path.includes('twitchExtension')
    }
  })
  return new Response(JSON.stringify(spec), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
