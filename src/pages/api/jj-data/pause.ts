import type { APIRoute } from 'astro'

function getStub(ctx: Parameters<APIRoute>[0]) {
  const DO = ctx.locals.runtime.env.JingleJamData
  const id = DO.idFromName('JJ_API_CACHE')
  return DO.get(id)
}

function authorize(ctx: Parameters<APIRoute>[0]): boolean {
  const secret = ctx.locals.runtime.env.ORPC_DEI_SIGNING_KEY
  const auth = ctx.request.headers.get('Authorization')
  if (!auth || !secret) return false
  return auth === `Bearer ${secret}`
}

export const GET: APIRoute = async (ctx) => {
  if (!authorize(ctx)) {
    return new Response('Unauthorized', { status: 401 })
  }
  const stub = getStub(ctx)
  const paused = await stub.isSchedulerPaused()
  return Response.json({ paused })
}

export const POST: APIRoute = async (ctx) => {
  if (!authorize(ctx)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body: any = await ctx.request.json().catch(() => null)
  if (!body || typeof body.paused !== 'boolean') {
    return new Response('Bad request: body must be { "paused": true | false }', {
      status: 400,
    })
  }

  const stub = getStub(ctx)
  await stub.setSchedulerPaused(body.paused)
  return Response.json({ paused: body.paused })
}
