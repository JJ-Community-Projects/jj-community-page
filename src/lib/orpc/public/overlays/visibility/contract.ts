import { oc } from '@orpc/contract'
import { z } from 'zod/v4'

/**
 * Whether overlay/community content is currently hidden behind the pre-event
 * placeholder. Backed by the `content:visibility` KV value (see
 * `src/lib/services/overlayVisibility.ts`).
 */
const getHiddenContract = oc.output(z.boolean()).route({
  path: '/overlays/visibility',
  method: 'GET',
  summary: 'Overlay content visibility',
  description:
    'True while overlay, community, teams and yogs content is hidden behind the pre-event placeholder.',
  tags: ['overlays'],
})

export const contracts = {
  getHiddenContract,
}
