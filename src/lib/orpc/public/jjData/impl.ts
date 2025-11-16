import { implement } from '@orpc/server'
import { jjDataContracts } from './contract.ts'
import { hasAstroContext } from '../../middleware/hasAstroContext.ts'

const os = implement(jjDataContracts).use(hasAstroContext)

const getJJDataProps = os.getJJDataPropsContract.handler(
  async ({ context, input }) => {
    const DO = context.env.JingleJamData
    const stubID = DO.idFromName('JJ_API_CACHE')
    const stub = DO.get(stubID)

    // Map method names to invocations on the DO stub
    const getters: Record<string, () => Promise<unknown>> = {
      // direct lists
      getCausesTV: () => stub.getCausesTV(),
      getCauses: () => stub.getCauses(),
      getCampaigns: () => stub.getCampaigns(),

      // simple numeric/string/meta getters
      getDollarConversionRate: () => stub.getDollarConversionRate(),
      getGbpToEurRate: () => stub.getGbpToEurRate(),
      getRaised: () => stub.getRaised(),
      getCollections: () => stub.getCollections(),
      getDonations: () => stub.getDonations(),
      getDate: () => stub.getDate(),

      // display aggregates
      getCampaignsDisplay: () => stub.getCampaignsDisplay(),
      getCausesDisplay: () => stub.getCausesDisplay(),
      getCommunityCampaignsDisplay: () => stub.getCommunityCampaignsDisplay(),

      // twitch related
      getLiveLogins: () => stub.getLiveLogins(),
      getAllCampaignDisplay: () => stub.getAllCampaignDisplay(),
      getValidTwitchLogins: () => stub.getValidTwitchLogins(),
      getInvalidTwitchLogins: () => stub.getInvalidTwitchLogins(),
      getAllTwitchLogins: () => stub.getAllTwitchLogins(),
      getAllYoutubeLogins: () => stub.getAllYoutubeLogins(),

      // user tags
      getUserTagsDisplay: () => stub.getUserTagsDisplay(),
    }

    const props = input.props
    // Determine which keys to resolve: if no input or empty array, return all
    const requestedKeys = !props || props.length === 0 ? Object.keys(getters) : input.props

    // Build response only for requested keys that we know how to resolve
    const entries = await Promise.all(
      requestedKeys
        .filter((k) => k in getters)
        .map(async (k) => {
          try {
            const val = await getters[k]()
            return [k, val] as const
          } catch (e) {
            // Surface failure as undefined value to not break whole response
            console.error('getJJDataProps error', k, e)
            return [k, undefined] as const
          }
        }),
    )

    return Object.fromEntries(entries)
  },
)

export const publicJJDataRouter = {
  getJJDataProps,
}
