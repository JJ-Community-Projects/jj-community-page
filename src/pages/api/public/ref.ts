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
  })
  return new Response(JSON.stringify(spec), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
