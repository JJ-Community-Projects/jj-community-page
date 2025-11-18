const prerender = false
import type { APIRoute } from 'astro'
import { draw_text, PhotonImage, resize, SamplingFilter, watermark, } from '@cf-wasm/photon'
import { getCollection, getEntries } from 'astro:content'

async function getCreators() {
  const collection = await getCollection('creators')
  const entries = await getEntries(collection)
  return entries.map((entry) => {
    const data = entry.data
    return {
      id: entry.id,
      ...data,
    }
  })
}

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

// Roughly estimate rendered text width for centering.
// Photon draw_text has no measure-text, so we approximate using
// average character width scaled by simple per-character weights.
function estimateTextWidth(text: string, fontSize: number): number {
  // Average width used previously (0.55 * fontSize), refined with weights
  const base = 0.55 * fontSize
  let sum = 0
  for (const ch of text) {
    // Very narrow characters
    if ("'`|!.,:;ilI[](){}".includes(ch)) {
      sum += base * 0.35
      continue
    }
    // Narrowish
    if ("tfrj1\u2019".includes(ch)) { // include curly apostrophe
      sum += base * 0.45
      continue
    }
    // Wide characters
    if ("MW@#%&".includes(ch)) {
      sum += base * 1.1
      continue
    }
    // Space and similar
    if (ch === ' ' || ch === '\u00A0') {
      sum += base * 0.5
      continue
    }
    // Ellipsis character
    if (ch === '…') {
      sum += base * 0.9
      continue
    }
    // Default average
    sum += base
  }
  return Math.round(sum)
}

export const GET: APIRoute = async ({ request, redirect, locals }) => {

  const env = locals.runtime.env.ENVIRONMENT as string
  if (env === "PROD") {
    return redirect('/jj-og-yogs.png')
  }

  const CARD_W = 1200
  const CARD_H = 630
  const AVATAR_SIZE = 140
  const AVATAR_BORDER = 6
  const MAX_AVATARS = 6
  const AVATAR_Y = 360

  const MAX_NAME_LEN = 18
  const FONT_SIZE = 28
  const LABEL_GAP_Y = 12
  const TEXT_COLOR: [number, number, number, number] = [255, 255, 255, 255]
  const SHADOW_COLOR: [number, number, number, number] = [0, 0, 0, 128]
  const reqUrl = new URL(request.url)
  try {
    const params = new URL(request.url).searchParams
    const filter = (params.get('filter') ?? '').trim()
    const slugs = filter
      ? filter
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    if (slugs.length === 0) {
      console.log('no slugs, redirecting to base image', filter)
      return redirect('/jj-og-yogs.png')
    }



    const creators = await getCreators()
    const ids = creators.map((c) => c.id)
    console.log('ids', ids)
    console.log('slugs', slugs)
    const selected = creators.filter((c) => slugs.includes(c.id))
    console.log('selected', selected)
    // Fetch up to MAX_AVATARS images
    const avatars: Uint8Array[] = []
    for (const c of selected) {
      const imgUrl = c.profileImage?.large
      if (!imgUrl) continue
      const buf = await fetchImage(imgUrl)
      if (buf) avatars.push(buf)
      if (avatars.length >= MAX_AVATARS) break
    }

    if (avatars.length === 0) {
      console.log('no valid avatars, redirecting to base image', filter)
      return redirect('/jj-og-yogs.png')
    }

    // Load base card from /public via same-origin fetch
    const baseRes = await fetch(new URL('/jj-og-yogs-filter.png', reqUrl))
    if (!baseRes.ok) {
      console.error('Failed to fetch base image:', baseRes.statusText, filter)
      return redirect('/jj-og-yogs.png')
    }

    const baseArrayBuffer = await baseRes.arrayBuffer()
    const baseUint8 = new Uint8Array(baseArrayBuffer)

    // Prepare composites: center the row of avatars
    const total = avatars.length
    // When there is only one avatar, make the image and font bigger
    const avatarSize = total === 1 ? 180 : AVATAR_SIZE
    const fontSize = total === 1 ? 40 : FONT_SIZE
    const spacing = avatarSize + 24
    const rowWidth = spacing * (total - 1)
    const startX = Math.round(CARD_W / 2 - rowWidth / 2 - avatarSize / 2)

    // Load base into Photon
    const baseImg = PhotonImage.new_from_byteslice(baseUint8)

    for (let i = 0; i < total; i++) {
      const x = startX + i * spacing
      const y = AVATAR_Y
      const avatarImg = PhotonImage.new_from_byteslice(avatars[i])
      const resized = resize(
        avatarImg,
        avatarSize,
        avatarSize,
        SamplingFilter.Nearest,
      )
      watermark(baseImg, resized, BigInt(x), BigInt(y))
      resized.free()
      avatarImg.free()
    }

    // Draw labels centered under each avatar
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

      const avatarCenterX = startX + i * spacing + Math.floor(avatarSize / 2)
      const labelY = AVATAR_Y + avatarSize + LABEL_GAP_Y

      // If your `draw_text` lacks alignment options, approximate centering
      const approxW = estimateTextWidth(label, fontSize)
      const x = avatarCenterX - Math.floor(approxW / 2)

      // Shadow for readability
      // draw_text signature varies by build; adapt color type if needed
      // @ts-ignore
      draw_text(baseImg, label, x, labelY + 2, fontSize)
      // @ts-ignore
      draw_text(baseImg, label, x, labelY, fontSize)
    }

    const outPng = baseImg.get_bytes()
    baseImg.free()

    const outAb = new ArrayBuffer(outPng.byteLength)
    new Uint8Array(outAb).set(outPng)

    // Return Response with PNG bytes
    return new Response(outAb, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[orpc] yogs-schedule-preview-image error:', err)
    return redirect('/jj-og-yogs.png')
  }
}
