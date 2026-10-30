/*
  Script: UI class guard (part of `npm run verify`)
  Checks the class strings in src/components, src/pages and src/layouts for
    - unknown:     classes Tailwind doesn't generate and no stylesheet in src/ defines
                   (typos, Tailwind 3 leftovers such as `bg-opacity-40`)
    - raw-palette: Tailwind's default colour palettes (gray, red, blue, ...) instead of the theme tokens
    - hex:         brand colours written out as hex instead of the theme tokens
  Findings that already exist are counted per file in check-ui-classes.baseline.json.
  The check fails when a file has more findings than its baseline; after cleaning a file up,
  lower the baseline with --update.

  Run: node check-ui-classes.ts [--list] [--update]
*/
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { __unstable__loadDesignSystem } from '@tailwindcss/node'

type Rule = 'unknown' | 'raw-palette' | 'hex'
type Finding = { rule: Rule; line: number; value: string }
type Counts = Partial<Record<Rule, number>>

const RULES: Rule[] = ['unknown', 'raw-palette', 'hex']
const ROOT = path.dirname(fileURLToPath(import.meta.url))
const SCAN_DIRS = ['src/components', 'src/pages', 'src/layouts']
const BASELINE = path.join(ROOT, 'check-ui-classes.baseline.json')

// Marker classes that only exist as selector hooks for Tailwind variants
const ALLOWED = new Set(['group', 'peer', 'not-prose'])
const RAW_PALETTE =
  /^(bg|text|border(-[xytrblse])?|ring|ring-offset|outline|from|via|to|fill|stroke|divide|decoration|shadow|accent|caret|placeholder|inset-ring|inset-shadow)-(slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)(\/.+)?$/
// primary, accent, their shades, the overlay ribbon black, and the QR code's near-misses
const BRAND_HEX = /#(e30e50|3584bf|57051f|09437a|313131|e21350|3484bf)\b/gi
// Quoted strings; '' and "" stay on one line, template literals may span lines
const STRING = /'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`/g
const CLASS_TOKEN = /^[!-]?[a-z0-9@[*&][^\s]*$/

const args = new Set(process.argv.slice(2))

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : Promise.resolve([full])
    }),
  )
  return files.flat()
}

// The utility part of a class: without variants (`md:`, `hover:`), `!` and a leading `-`
function utilityOf(token: string): string {
  let depth = 0
  let start = 0
  for (let i = 0; i < token.length; i++) {
    const char = token[i]
    if (char === '[' || char === '(') depth++
    else if (char === ']' || char === ')') depth--
    else if (char === ':' && depth === 0) start = i + 1
  }
  return token.slice(start).replace(/^!|!$/g, '').replace(/^-/, '')
}

type ClassString = { tokens: string[]; offset: number; isAttribute: boolean }

// Every string literal in the file; an interpolation's own strings are scanned too
function classStrings(code: string, offset = 0): ClassString[] {
  const found: ClassString[] = []
  for (const match of code.matchAll(STRING)) {
    const start = offset + match.index
    const template = match[3]
    let body = match[1] ?? match[2] ?? ''
    if (template !== undefined) {
      body = template.replace(/\$\{([\s\S]*?)\}/g, (_, inner: string) => {
        found.push(...classStrings(inner, start))
        return ' '
      })
    }
    const before = code.slice(Math.max(0, match.index - 10), match.index)
    found.push({
      tokens: body.split(/\s+/).filter(Boolean),
      offset: start,
      isAttribute: /\b(class|className)=$/.test(before),
    })
  }
  return found
}

async function customClasses(files: string[]): Promise<Set<string>> {
  const names = new Set<string>()
  for (const file of files) {
    if (!/\.(css|astro)$/.test(file)) continue
    let css = await fs.readFile(file, 'utf8')
    if (file.endsWith('.astro')) {
      css = [...css.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    }
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) names.add(m[1])
  }
  return names
}

async function main() {
  const css = await fs.readFile(path.join(ROOT, 'src/styles/global.css'), 'utf8')
  const design = await __unstable__loadDesignSystem(css, { base: path.join(ROOT, 'src/styles') })

  const allFiles = await walk(path.join(ROOT, 'src'))
  const custom = await customClasses(allFiles)
  const sources = allFiles.filter(
    (file) =>
      SCAN_DIRS.some((dir) => file.startsWith(path.join(ROOT, dir) + path.sep)) &&
      /\.(astro|tsx|ts)$/.test(file) &&
      !/\.(test|d)\.ts$/.test(file),
  )

  // Pass 1: collect the strings; validate every distinct token in one Tailwind call
  const perFile = new Map<string, { code: string; strings: ClassString[] }>()
  const distinct = new Set<string>()
  for (const file of sources) {
    const code = await fs.readFile(file, 'utf8')
    const strings = classStrings(code).filter((s) => s.tokens.every((t) => CLASS_TOKEN.test(t)))
    strings.forEach((s) => s.tokens.forEach((t) => distinct.add(t)))
    perFile.set(path.relative(ROOT, file), { code, strings })
  }
  const tokens = [...distinct]
  const generated = design.candidatesToCss(tokens)
  const valid = new Set(tokens.filter((_, i) => generated[i] !== null))
  const known = (token: string) =>
    valid.has(token) ||
    custom.has(token) ||
    ALLOWED.has(token) ||
    /^(group|peer)\/[\w-]+$/.test(token)

  // Pass 2: findings per file
  const results = new Map<string, Finding[]>()
  for (const [file, { code, strings }] of perFile) {
    const lineAt = (offset: number) => code.slice(0, offset).split('\n').length
    const findings: Finding[] = []
    for (const s of strings) {
      // A string counts as classes when it sits in a class attribute or mostly holds real classes
      const realClasses = s.tokens.filter((t) => valid.has(t)).length
      if (!s.isAttribute && (realClasses === 0 || realClasses < s.tokens.length / 2)) continue
      for (const token of s.tokens) {
        if (!known(token)) findings.push({ rule: 'unknown', line: lineAt(s.offset), value: token })
        else if (RAW_PALETTE.test(utilityOf(token)))
          findings.push({ rule: 'raw-palette', line: lineAt(s.offset), value: token })
      }
    }
    for (const m of code.matchAll(BRAND_HEX)) {
      findings.push({ rule: 'hex', line: lineAt(m.index), value: m[0] })
    }
    if (findings.length) results.set(file, findings)
  }

  const counts = (findings: Finding[]): Counts =>
    Object.fromEntries(
      RULES.map((rule) => [rule, findings.filter((f) => f.rule === rule).length]).filter(([, n]) => n),
    )

  if (args.has('--update')) {
    const baseline = Object.fromEntries(
      [...results].sort(([a], [b]) => a.localeCompare(b)).map(([file, f]) => [file, counts(f)]),
    )
    await fs.writeFile(BASELINE, JSON.stringify(baseline, null, 2) + '\n')
    console.log(`ui class guard: baseline written for ${results.size} files`)
    return
  }

  const baseline: Record<string, Counts> = JSON.parse(await fs.readFile(BASELINE, 'utf8').catch(() => '{}'))
  const totals: Record<Rule, number> = { unknown: 0, 'raw-palette': 0, hex: 0 }
  let failed = false
  let improved = false
  for (const file of new Set([...results.keys(), ...Object.keys(baseline)])) {
    const findings = results.get(file) ?? []
    const current = counts(findings)
    for (const rule of RULES) {
      const now = current[rule] ?? 0
      const allowed = baseline[file]?.[rule] ?? 0
      totals[rule] += now
      if (now < allowed) improved = true
      const over = now > allowed
      if (over) failed = true
      if (over || (args.has('--list') && now)) {
        console.log(`${file}: ${rule} ${now} (baseline ${allowed})`)
        for (const f of findings.filter((f) => f.rule === rule)) console.log(`  ${file}:${f.line}  ${f.value}`)
      }
    }
  }

  console.log(
    `ui class guard: unknown ${totals.unknown}, raw-palette ${totals['raw-palette']}, hex ${totals.hex}`,
  )
  if (failed) {
    console.log('New findings above: use the theme tokens in src/styles/global.css, or fix the class name.')
    process.exit(1)
  }
  if (improved) console.log('Some files are below their baseline: run with --update to lock that in.')
}

await main()
