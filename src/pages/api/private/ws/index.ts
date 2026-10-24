// src/pages/api/private/ws/[...ws].ts
import { env } from 'cloudflare:workers'
import type { APIRoute } from 'astro'
import { upgradeDurableIteratorRequest } from '@orpc/experimental-durable-iterator/durable-object'
import { rejectCrossOrigin } from '../../../../lib/sameOrigin.ts'

function resolveNamespaceByChannel(
  env: Env,
  chn: string,
): DurableObjectNamespace<any> | null {
  // Map your existing channel conventions to DO namespaces
  // Friends
  if (chn.startsWith('friends:req:incoming:'))
    return env.FriendRequestIncomingObject
  if (chn.startsWith('friends:req:sent:')) return env.FriendRequestSentObject
  if (chn.startsWith('friends:list:')) return env.FriendsListObject
  // Teams
  if (chn.startsWith('teams:user:invites:')) return env.UserTeamInvitesObject
  if (chn.startsWith('teams:user:teams:')) return env.UserTeamsObject
  if (chn.startsWith('teams:admin:invites:')) return env.TeamAdminInvitesObject
  if (chn.startsWith('teams:admin:members:')) return env.TeamAdminMembersObject
  // Schedule Editing
  if (chn.startsWith('schedule:edit:')) return env.ScheduleEditingObject
  return null
}

export const ALL: APIRoute = async (context) => {
  const rejected = rejectCrossOrigin(context.request)
  if (rejected) return rejected
  try {
    const url = new URL(context.request.url)
    const signingKey = env.ORPC_DEI_SIGNING_KEY
    if (!signingKey) return new Response('Missing signing key', { status: 500 })

    const rawToken = url.searchParams.get('token')
    if (!rawToken) return new Response('Missing token', { status: 400 })
    const [jsonStr] = rawToken.split('.')
    const payload = JSON.parse(jsonStr)
    const chn = String(payload.chn || '')
    if (!chn)
      return new Response('Invalid token payload (missing chn)', {
        status: 401,
      })
    const namespace = resolveNamespaceByChannel(env, chn)
    if (!namespace) return new Response('Unsupported channel', { status: 400 })

    // Delegate upgrade to DEI helper (it will also validate token integrity)
    return await upgradeDurableIteratorRequest(context.request, {
      signingKey,
      namespace,
    })
  } catch (err) {
    console.error('[DEI WS Upgrade] Failed:', err)
    return new Response('Unauthorized', { status: 401 })
  }
}
