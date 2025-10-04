import { contracts } from './contract.ts'
import { dbMiddleware } from '../../middleware/dbMiddleware.ts'
import { implement } from '@orpc/server'

const os = implement(contracts).use(dbMiddleware)

const campaigns = os.campaignsContract.handler(async ({ context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)
  try {
    const campaigns = await stub.getCampaigns()
    if (!campaigns) {
      return {
        count: 0,
        list: [],
      }
    }

    return campaigns
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    throw e
  }
})

const causes = os.causesContract.handler(async ({ context }) => {
  const DO = context.env.JingleJamData
  const stubID = DO.idFromName('JJ_API_CACHE')
  const stub = DO.get(stubID)

  const causes = await stub.getCauses()
  if (!causes) {
    return []
  }

  return causes
})

export const jjData = {
  campaigns,
  causes,
}
