// Self-contained Node.js script
// Loads all schedule streams from src/content and counts most common creator combinations
// Usage: node countCreatorCombos.js [--top 20] [--pairs] [--full]

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

function readYamlSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    return yaml.load(raw)
  } catch (e) {
    console.warn(`Failed to read ${filePath}:`, e?.message ?? e)
    return null
  }
}

function* kCombinations(arr, k) {
  const n = arr.length
  if (k <= 0 || k > n) return
  const idx = Array.from({ length: k }, (_, i) => i)
  while (true) {
    yield idx.map((i) => arr[i])
    // find pos to increment
    let i = k - 1
    while (i >= 0 && idx[i] === i + n - k) i--
    if (i < 0) break
    idx[i]++
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1
  }
}

function countUp(map, key) {
  map.set(key, (map.get(key) || 0) + 1)
}

function sortAndKey(slugs) {
  const uniq = Array.from(new Set(slugs.filter(Boolean)))
  uniq.sort()
  return uniq
}

function toKey(slugs) {
  return slugs.join(',')
}

function readYears(scheduleDir) {
  if (!fs.existsSync(scheduleDir)) return []
  return fs
    .readdirSync(scheduleDir)
    .filter((f) => f.toLowerCase().endsWith('.yaml'))
    .map((f) => path.basename(f).replace(/\.ya?ml$/i, ''))
}

function loadStreamsForYear(year) {
  const schedulePath = path.join('src', 'content', 'schedules', `${year}.yaml`)
  const schedule = readYamlSafe(schedulePath)
  if (!schedule) return []
  const streams = []
  const dayDir = path.join('src', 'content', 'scheduleDays')
  const weeks = Array.isArray(schedule.weeks) ? schedule.weeks : []
  for (const week of weeks) {
    const days = Array.isArray(week?.days) ? week.days : []
    for (const dayRef of days) {
      const dayPath = path.join(dayDir, `${dayRef}.yaml`)
      const dayData = readYamlSafe(dayPath)
      if (!dayData) continue
      const dayStreams = Array.isArray(dayData.streams) ? dayData.streams : []
      for (const stream of dayStreams) {
        const creators = Array.isArray(stream?.creators) ? stream.creators : []
        streams.push({ creators })
      }
    }
  }
  return streams
}

function tallyAll() {
  const scheduleDir = path.join('src', 'content', 'schedules')
  const years = readYears(scheduleDir)
  const overall = { fullSets: new Map(), pairs: new Map() }
  const perYear = {}

  for (const year of years) {
    const yearTallies = { fullSets: new Map(), pairs: new Map() }
    const streams = loadStreamsForYear(year)
    for (const s of streams) {
      const sorted = sortAndKey(s.creators)
      if (sorted.length === 0) continue
      // Full set
      countUp(overall.fullSets, toKey(sorted))
      countUp(yearTallies.fullSets, toKey(sorted))
      // Pairs
      if (sorted.length >= 2) {
        for (const pair of kCombinations(sorted, 2)) {
          const key = toKey(pair)
          countUp(overall.pairs, key)
          countUp(yearTallies.pairs, key)
        }
      }
    }
    perYear[year] = yearTallies
  }

  return { overall, perYear }
}

function topNFromMap(map, n) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ combo: key, count, size: key ? key.split(',').length : 0 }))
}

function mapToObject(map) {
  return Object.fromEntries(Array.from(map.entries()))
}

function dumpJson(out, data) {
  fs.writeFileSync(out, JSON.stringify(data, null, 2))
  console.log(`Wrote ${out}`)
}

async function main() {
  // CLI args
  const args = new Set(process.argv.slice(2))
  const top = (() => {
    const i = process.argv.indexOf('--top')
    if (i >= 0 && process.argv[i + 1]) {
      const n = parseInt(process.argv[i + 1], 10)
      return Number.isFinite(n) && n > 0 ? n : 20
    }
    return 20
  })()
  const showPairs = args.has('--pairs') || !args.has('--full') // default show both
  const showFull = args.has('--full') || !args.has('--pairs')

  const { overall, perYear } = tallyAll()

  console.log('Most common creator combinations across all years:')
  if (showFull) {
    console.log(`\nTop ${top} full-set combinations:`)
    for (const row of topNFromMap(overall.fullSets, top)) {
      console.log(`${row.count} × [${row.combo}]`)
    }
  }
  if (showPairs) {
    console.log(`\nTop ${top} pairs:`)
    for (const row of topNFromMap(overall.pairs, top)) {
      console.log(`${row.count} × [${row.combo}]`)
    }
  }

  console.log('\nPer-year top combinations:')
  for (const year of Object.keys(perYear).sort()) {
    console.log(`\nYear ${year}:`)
    if (showFull) {
      console.log(`  Top ${top} full-sets:`)
      for (const row of topNFromMap(perYear[year].fullSets, top)) {
        console.log(`  ${row.count} × [${row.combo}]`)
      }
    }
    if (showPairs) {
      console.log(`  Top ${top} pairs:`)
      for (const row of topNFromMap(perYear[year].pairs, top)) {
        console.log(`  ${row.count} × [${row.combo}]`)
      }
    }
  }

  // Write structured JSON
  const outPath = path.join(process.cwd(), 'creator-combos-stats.json')
  const json = {
    generatedAt: new Date().toISOString(),
    overall: {
      fullSets: mapToObject(overall.fullSets),
      pairs: mapToObject(overall.pairs),
    },
    years: Object.fromEntries(
      Object.entries(perYear).map(([year, t]) => [year, {
        fullSets: mapToObject(t.fullSets),
        pairs: mapToObject(t.pairs),
      }])
    ),
  }
  dumpJson(outPath, json)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
