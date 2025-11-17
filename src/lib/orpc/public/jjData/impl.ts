import { implement, ORPCError } from '@orpc/server'
import { jjDataContracts, yogsImageContracts } from './contract.ts'
import { hasAstroContext } from '../../middleware/hasAstroContext.ts'
import { getYogsScheduleFromContent } from '../../../../content/getYogsScheduleFromContent.ts'
import { draw_text, PhotonImage, resize, SamplingFilter, watermark, } from '@cf-wasm/photon'
import { cacheMiddleware } from '../../middleware/cacheControl.ts'

const os = implement({ ...jjDataContracts, ...yogsImageContracts }).use(
  hasAstroContext,
)

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
    const requestedKeys =
      !props || props.length === 0 ? Object.keys(getters) : input.props

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

// Helper to download images as Uint8Array with timeout
async function fetchImage(
  url: string,
  timeoutMs = 6000,
): Promise<Uint8Array | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) return null
    const arr = await res.arrayBuffer()
    return new Uint8Array(arr)
  } catch (_) {
    return null
  }
}

function ellipsize(s: string, max = 18) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

const getYogsSchedulePreviewImage = os.getYogsSchedulePreviewImageContract
  .use(
    cacheMiddleware({
      maxAge: 300,
      sMaxAge: 300,
      staleWhileRevalidate: 60,
    }),
  )
  .handler(async ({ context, input }) => {
    // Card/base constants
    const CARD_W = 1200
    const CARD_H = 630
    const AVATAR_SIZE = 120
    const AVATAR_BORDER = 6
    const MAX_AVATARS = 6
    const AVATAR_Y = 380

    const MAX_NAME_LEN = 18
    const FONT_SIZE = 22
    const LABEL_GAP_Y = 12
    const TEXT_COLOR: [number, number, number, number] = [255, 255, 255, 255]
    const SHADOW_COLOR: [number, number, number, number] = [0, 0, 0, 128]
    const reqUrl = new URL(context.request.url)
    try {
      const filter = (input.filter ?? '').trim()
      const yearParam = (input.year ?? '2025').toString().trim() || '2025'
      const year = parseInt(yearParam, 10)
      const slugs = filter
        ? filter
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []


      // Load base card from /public via same-origin fetch
      const baseRes = await fetch(new URL('/jj-og-yogs-filter.png', reqUrl))
      if (!baseRes.ok) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Base image not found',
        })
      }

      const baseArrayBuffer = await baseRes.arrayBuffer()
      const baseUint8 = new Uint8Array(baseArrayBuffer)

      if (slugs.length === 0) {
        // Return a File to satisfy z.file().mime("image/png") schema
        const baseRes = await fetch(new URL('/jj-og-yogs.png', reqUrl))
        const baseArrayBuffer = await baseRes.arrayBuffer()
        return new File([baseArrayBuffer], 'yogs-schedule-preview.png', {
          type: 'image/png',
        })
      }

      // Get creators from content
      const schedule = await getYogsScheduleFromContent(year)
      const creators = schedule.creators || []
      const selected = creators.filter((c) => slugs.includes(c.id))

      // Fetch up to MAX_AVATARS images
      const avatars: Uint8Array[] = []
      for (const c of selected) {
        const imgUrl = (c as any).imageUrl || null
        if (!imgUrl) continue
        const buf = await fetchImage(imgUrl)
        if (buf) avatars.push(buf)
        if (avatars.length >= MAX_AVATARS) break
      }

      if (avatars.length === 0) {
        // Return a File (no overlays) per schema
        const baseRes = await fetch(new URL('/jj-og-yogs.png', reqUrl))
        const baseArrayBuffer = await baseRes.arrayBuffer()
        return new File([baseArrayBuffer], 'yogs-schedule-preview.png', {
          type: 'image/png',
        })
      }

      // Prepare composites: center the row of avatars
      const total = avatars.length
      const spacing = AVATAR_SIZE + 24
      const rowWidth = spacing * (total - 1)
      const startX = Math.round(CARD_W / 2 - rowWidth / 2 - AVATAR_SIZE / 2)

      // Load base into Photon
      const baseImg = PhotonImage.new_from_byteslice(baseUint8)

      for (let i = 0; i < total; i++) {
        const x = startX + i * spacing
        const y = AVATAR_Y
        const avatarImg = PhotonImage.new_from_byteslice(avatars[i])
        const resized = resize(
          avatarImg,
          AVATAR_SIZE,
          AVATAR_SIZE,
          SamplingFilter.Nearest,
        )
        watermark(baseImg, resized, BigInt(x), BigInt(y))
        resized.free()
        avatarImg.free()
      }

      // Draw labels centered under each avatar
      const estCharW = Math.round(0.55 * FONT_SIZE)
      for (let i = 0; i < total; i++) {
        const creator = selected[i]
        if (!creator) continue
        const label = ellipsize(
          (
            creator.name ||
            (creator as any).displayName ||
            (creator as any).title ||
            creator.id ||
            ''
          ).toString(),
        )
        if (!label) continue

        const avatarCenterX = startX + i * spacing + Math.floor(AVATAR_SIZE / 2)
        const labelY = AVATAR_Y + AVATAR_SIZE + LABEL_GAP_Y

        // If your `draw_text` lacks alignment options, approximate centering
        const approxW = estCharW * label.length
        const x = avatarCenterX - Math.floor(approxW / 2)

        // Shadow for readability
        // draw_text signature varies by build; adapt color type if needed
        // @ts-ignore
        draw_text(baseImg, label, x, labelY + 2, FONT_SIZE)
        // @ts-ignore
        draw_text(baseImg, label, x, labelY, FONT_SIZE)
      }

      const outPng = baseImg.get_bytes()
      baseImg.free()

      const outAb = new ArrayBuffer(outPng.byteLength)
      new Uint8Array(outAb).set(outPng)

      // Return File object matching z.file().mime('image/png')
      return new File([outAb], 'yogs-schedule-preview.png', {
        type: 'image/png',
      })
    } catch (err) {
      console.error('[orpc] yogs-schedule-preview-image error:', err)
      const baseRes = await fetch(new URL('/jj-og-yogs.png', reqUrl))
      const baseArrayBuffer = await baseRes.arrayBuffer()
      return new File([baseArrayBuffer], 'yogs-schedule-preview.png', {
        type: 'image/png',
      })
    }
  })

export const publicJJDataRouter = {
  getJJDataProps,
  getYogsSchedulePreviewImage,
}
