// Node.js script (no external deps) to read Jingle Jam schedule day YAML files
// and generate a normalized JSON schedule file with the required shape.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DAYS_DIR = path.join(ROOT, 'src', 'content', 'scheduleDays')
const SCHEDULES_DIR = path.join(ROOT, 'src', 'content', 'schedules')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function detectYearExplicitOrLatest(dir, explicitYear) {
  if (explicitYear) return String(explicitYear)
  const years = []
  if (!fs.existsSync(dir)) return null
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) years.push(entry.name)
  }
  years.sort()
  return years.length ? years[years.length - 1] : null
}

function stripQuotes(s) {
  if (s == null) return s
  const t = String(s).trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1)
  return t
}

function parseInlineArray(val) {
  const inner = val.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (!inner.trim()) return []
  return inner
    .split(',')
    .map((x) => stripQuotes(x))
    .map((x) => x.trim())
    .filter(Boolean)
}

function parseDayYaml(text) {
  const lines = text.split(/\r?\n/)
  let date = null
  const streams = []
  let inStreams = false
  let current = null
  let inColorsList = false
  let colorsIndent = 0
  let inVodsList = false
  let vodsIndent = 0
  let streamsListIndent = null

  function indentOf(line) {
    const m = line.match(/^(\s*)/)
    return m ? m[1].length : 0
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.replace(/\t/g, '    ')
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (!inStreams && /^date\s*:/.test(trimmed)) {
      date = stripQuotes(trimmed.split(':').slice(1).join(':'))
      continue
    }

    if (/^streams\s*:/.test(trimmed)) {
      inStreams = true
      continue
    }

    if (inStreams) {
      const ind = indentOf(line)

      // Handle nested colors list
      if (inColorsList) {
        if (ind <= colorsIndent) {
          inColorsList = false
        } else if (/^-\s+/.test(trimmed)) {
          const colorVal = stripQuotes(trimmed.replace(/^-[\s]*/, ''))
          if (!current?.color && /^#([A-Fa-f0-9]{6})$/.test(colorVal)) current.color = colorVal
          continue
        }
      }

      // Handle nested vods list (ignored for output)
      if (inVodsList) {
        if (ind <= vodsIndent) {
          inVodsList = false
        } else if (/^-\s+/.test(trimmed)) {
          continue
        }
      }

      // New stream list item only at first-level list under streams
      if (/^-\s+/.test(trimmed)) {
        if (streamsListIndent == null) streamsListIndent = ind
        if (ind === streamsListIndent) {
          if (current) {
            const meaningful = (current.title && current.title.trim()) || current.start || current.end || (current.creators && current.creators.length)
            if (meaningful) streams.push(current)
          }
          // Start fresh stream
          current = { title: '', start: '', end: '', creators: [], color: null, _durationHours: null }
          inColorsList = false
          colorsIndent = 0
          inVodsList = false
          vodsIndent = 0

          // Handle inline key after dash (e.g., "- creators: [a,b]")
          const afterDash = trimmed.replace(/^\-\s+/, '')
          const inlineMatch = afterDash.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/)
          if (inlineMatch) {
            const k = inlineMatch[1]
            const v = inlineMatch[2]
            if (k === 'creators') {
              if (/^\[/.test(v)) current.creators = parseInlineArray(v)
            } else if (k === 'start' || k === 'end') {
              current[k] = stripQuotes(v)
            } else if (k === 'title') {
              current.title = stripQuotes(v)
            } else if (k === 'color') {
              current.color = stripQuotes(v)
            } else if (k === 'duration_hours') {
              const num = Number(stripQuotes(v))
              if (!Number.isNaN(num)) current._durationHours = num
            }
          }
          continue
        }
      }

      if (!current) continue

      const kvMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/)
      if (kvMatch) {
        const key = kvMatch[1]
        const rawVal = kvMatch[2]

        if (key === 'creators') {
          if (/^\[/.test(rawVal)) current.creators = parseInlineArray(rawVal)
          inColorsList = false
          inVodsList = false
        } else if (key === 'start' || key === 'end') {
          current[key] = stripQuotes(rawVal)
          inColorsList = false
          inVodsList = false
        } else if (key === 'title') {
          current.title = stripQuotes(rawVal)
          inColorsList = false
          inVodsList = false
        } else if (key === 'color') {
          current.color = stripQuotes(rawVal)
          inColorsList = false
          inVodsList = false
        } else if (key === 'duration_hours') {
          const num = Number(stripQuotes(rawVal))
          if (!Number.isNaN(num)) current._durationHours = num
          inColorsList = false
          inVodsList = false
        } else if (key === 'style' || key === 'background' || key === 'tileSize' || key === 'subtitle' || key === 'description' || key === 'orientation') {
          inColorsList = false
        } else if (key === 'vods') {
          inVodsList = true
          vodsIndent = ind
        } else if (key === 'colors') {
          inColorsList = true
          colorsIndent = ind
        } else {
          inColorsList = false
        }
        continue
      }
    }
  }

  if (current) {
    const meaningful = (current.title && current.title.trim()) || current.start || current.end || (current.creators && current.creators.length)
    if (meaningful) streams.push(current)
  }

  const DEFAULT_COLOR = '#3484bf'
  for (const s of streams) {
    if (!s.color || !/^#([A-Fa-f0-9]{6})$/.test(s.color)) s.color = DEFAULT_COLOR
    if (!s.end && s.start && s._durationHours != null) {
      const startDate = new Date(s.start)
      if (!isNaN(startDate.getTime())) {
        const ms = Math.round(Number(s._durationHours) * 60 * 60 * 1000)
        const endDate = new Date(startDate.getTime() + ms)
        s.end = endDate.toISOString().replace('.000Z', 'Z')
      }
    }
    delete s._durationHours
  }

  streams.sort((a, b) => (a.start || '').localeCompare(b.start || ''))
  return { date, streams }
}

function readTitleFromScheduleYaml(year) {
  const file = path.join(SCHEDULES_DIR, `${year}.yaml`)
  if (!fs.existsSync(file)) return null
  try {
    const firstKb = fs.readFileSync(file, 'utf8')
    const m = firstKb.match(/\btitle\s*:\s*(.*)/)
    if (m) return stripQuotes(m[1])
  } catch {}
  return null
}

function listDayFiles(year) {
  const yearDir = path.join(DAYS_DIR, String(year))
  if (!fs.existsSync(yearDir)) return []
  const out = []
  for (const ent of fs.readdirSync(yearDir, { withFileTypes: true })) {
    if (ent.isFile() && /\.ya?ml$/i.test(ent.name)) {
      out.push(path.join(yearDir, ent.name))
    } else if (ent.isDirectory()) {
      const nestedDir = path.join(yearDir, ent.name)
      for (const f of fs.readdirSync(nestedDir, { withFileTypes: true })) {
        if (f.isFile() && /\.ya?ml$/i.test(f.name)) out.push(path.join(nestedDir, f.name))
      }
    }
  }
  return out
}

function buildSchedule(year, explicitTitle) {
  const files = listDayFiles(year)
  if (!files.length) throw new Error(`No day files found for year ${year} under ${DAYS_DIR}`)

  const days = []
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8')
    const day = parseDayYaml(raw)
    if (!day.date) {
      const base = path.basename(file, path.extname(file))
      const m = base.match(/(\d{2}-\d{2})/)
      if (m) day.date = `${year}-${m[1]}`
    }
    if (day.date && day.streams && day.streams.length) days.push(day)
  }

  for (const d of days) {
    const m = d.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) {
      const parts = d.date.split('-').map((x) => x.padStart(2, '0'))
      if (parts.length === 3) d.date = `${parts[0]}-${parts[1]}-${parts[2]}`
    }
  }
  days.sort((a, b) => a.date.localeCompare(b.date))

  const title = explicitTitle || readTitleFromScheduleYaml(year) || `Yogscast Jingle Jam ${year}`

  for (const d of days) {
    d.streams = d.streams.map((s) => ({
      title: s.title || '',
      start: s.start || '',
      end: s.end || '',
      color: s.color || '#3484bf',
      creators: Array.isArray(s.creators) ? s.creators : [],
    }))
  }

  return { title, days }
}

function main() {
  const args = parseArgs()
  const year = detectYearExplicitOrLatest(DAYS_DIR, args.year)
  if (!year) {
    console.error('Failed to determine year. Provide --year=YYYY or ensure src/content/scheduleDays/YYYY exists.')
    process.exit(1)
  }

  const outPath = path.resolve(args.out || path.join(ROOT, `${year}.json`))
  const title = args.title

  const schedule = buildSchedule(year, title)

  for (const d of schedule.days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
      console.warn('Warning: day.date is not in YYYY-MM-DD format:', d.date)
    }
    for (const s of d.streams) {
      if (!s.start.endsWith('Z') || !s.end.endsWith('Z')) {
        console.warn('Warning: stream start/end do not appear to be UTC (Z):', s.title, s.start, s.end)
      }
      if (!/^#([A-Fa-f0-9]{6})$/.test(s.color)) {
        console.warn('Warning: stream color not hex RRGGBB; defaulting:', s.color)
        s.color = '#3484bf'
      }
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(schedule, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${outPath} with ${schedule.days.length} day(s).`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
