// Self-contained Node.js script to generate Yogs schedule preview images
// Mirrors logic from API/orpc handlers without importing from them.
// - Reads creators from src/content/creators (YAML files)
// - Builds 1, 2, 3-combinations of creator filters
// - Composites avatars and labels onto /public/jj-og-yogs-filter.png
// - Falls back to /public/jj-og-yogs.png when no avatars could be fetched
// - Writes results to public/yogs-schedule-preview/<filter>.png

import fs from 'node:fs'
import path from 'node:path'
import * as yaml from 'yaml'

// Config/Constants matching the API logic
const CARD_W = 1200
const CARD_H = 630
const AVATAR_SIZE = 120
const MAX_AVATARS = 6
const AVATAR_Y = 380
const FONT_SIZE = 22
const LABEL_GAP_Y = 12

function ellipsize(s, max = 18) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function fetchImage(url, timeoutMs = 6000) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: ctrl.signal,
      // Some CDNs (incl. Twitch) may reject requests without typical headers
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })
    clearTimeout(t)
    if (!res.ok) {
      console.error('Failed to fetch image', url, res.status, res.statusText)
      return null
    }
    const arr = await res.arrayBuffer()
    console.log('Fetched', url, arr.byteLength, 'bytes')
    return Buffer.from(arr)
  } catch (e) {
    console.error('Failed to fetch image', url, e)
    return null
  }
}

function readCreatorsFromContent() {
  const creatorsDir = path.join(process.cwd(), 'src/content/creators')
  const files = fs.readdirSync(creatorsDir)
  const creators = []
  for (const file of files) {
    const full = path.join(creatorsDir, file)
    if (!fs.statSync(full).isFile()) continue
    const raw = fs.readFileSync(full, 'utf8')
    const data = yaml.parse(raw)
    const id = path.basename(file).replace(/\.(ya?ml|md)$/i, '')
    creators.push({ id, ...data })
  }
  return creators
}

function buildFilters(creators) {
  const ids = creators.map((c) => c.id)
  const out = new Set()
  // one
  for (const a of ids) out.add(a)

  out.add('lewis,simon')
  out.add('lewis,spiff')
  out.add('lewis,lydia')
  out.add('tom,lydia')
  out.add('lewis,tom')
  out.add('ben,tom')
  out.add('ben,mousie')
  out.add('ravs,sips')
  out.add('bouphe,osie')
  out.add('duncan,osie')
  out.add('boba,pedguin')
  out.add('briony,kirsty')
  out.add('lewis,harry,simon,duncan')
  out.add('nilesy,breeh,zylus')
  out.add('nilesy,breeh,zylus,rythian')
  out.add('nilesy,breeh,zylus,rythian,ravs')
  out.add('tom,pyrion')
  return Array.from(out)
}

function loadBaseImageBytes() {
  const publicDir = path.join(process.cwd(), 'public')
  const filtered = path.join(publicDir, 'jj-og-yogs-filter.png')
  const fallback = path.join(publicDir, 'jj-og-yogs.png')
  let baseBytes = null
  if (fs.existsSync(filtered)) {
    baseBytes = new Uint8Array(fs.readFileSync(filtered))
  } else if (fs.existsSync(fallback)) {
    baseBytes = new Uint8Array(fs.readFileSync(fallback))
  }
  return { baseBytes, fallbackPath: fallback }
}

async function composeForFilter(filter, creators, baseBytes, fallbackPath) {
  // Normalize and sort slugs alphabetically for deterministic ordering
  const slugs = filter
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  if (slugs.length === 0) {
    // default fallback image
    return fs.readFileSync(fallbackPath)
  }

  // Fetch the final, server-rendered image from the local API
  const apiUrl = `http://localhost:3000/api/public/img/yogs-schedule-preview?filter=${encodeURIComponent(
    slugs.join(','),
  )}`
  console.log('Fetching composed image from API:', apiUrl)
  const buf = await fetchImage(apiUrl)
  if (buf && buf.length > 0) return buf

  // Fallback if API fetch fails
  return fs.readFileSync(fallbackPath)
}

async function main() {
  const creators = readCreatorsFromContent()
  if (!creators.length) {
    console.warn('No creators found in src/content/creators')
  }

  const { baseBytes, fallbackPath } = loadBaseImageBytes()
  if (!baseBytes && !fs.existsSync(fallbackPath)) {
    console.error('Base images not found: public/jj-og-yogs-filter.png or public/jj-og-yogs.png')
    process.exit(1)
  }

  const outDir = path.join(process.cwd(), 'public', 'yogs-schedule-preview')
  fs.mkdirSync(outDir, { recursive: true })

  const filters = buildFilters(creators)
  console.log(`Generating ${filters.length} images…`)

  let generated = 0
  for (const filter of filters) {
    try {
      const png = await composeForFilter(filter, creators, baseBytes, fallbackPath)
      // Ensure filename slugs are normalized and sorted alphabetically
      const sortedSlugsForName = filter
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
      const name = `${sortedSlugsForName.join('-')}.png`
      const dest = path.join(outDir, name)
      console.log('dest', dest)
      fs.writeFileSync(dest, png)
      generated++
      if (generated % 50 === 0) console.log(`…${generated} done`)
    } catch (e) {
      console.error('Failed for filter', filter, e)
    }
  }

  // Also write a default (no filter) image if desired
  try {
    const defaultDest = path.join(outDir, `index.png`)
    const fallback = fs.readFileSync(fallbackPath)
    fs.writeFileSync(defaultDest, fallback)
  } catch {}

  console.log(`Done. Generated ${generated} images in ${outDir}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
