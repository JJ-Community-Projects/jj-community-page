import { defineConfig, sessionDrivers } from 'astro/config'

import solidJs from '@astrojs/solid-js'

import cloudflare from '@astrojs/cloudflare'

import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

/**
 * vite-plugin-solid excludes Solid source packages (e.g. solid-icons) only from the client dep optimizer.
 * In the workerd SSR environment Vite 8 would pre-bundle them with Rolldown's default React JSX runtime
 * ("Cannot find module 'react/jsx-runtime'"), so apply the same exclude list to the server environments.
 */
function excludeSolidDepsFromSsrOptimizer() {
  let solidExcludes = []
  return {
    name: 'exclude-solid-deps-from-ssr-optimizer',
    config(config) {
      solidExcludes = config.optimizeDeps?.exclude ?? []
    },
    configEnvironment(name) {
      if (name === 'ssr' || name === 'prerender') {
        return { optimizeDeps: { exclude: solidExcludes } }
      }
    },
  }
}

/**
 * Non-prod builds (beta, local) send `X-Robots-Tag: noindex` on asset-layer files too: prerendered
 * archive pages, robots.txt and the sitemap never reach the Worker middleware that sets it elsewhere.
 * The deploy scripts build per environment, so prod's `_headers` stays as it is.
 */
function noindexAssetsOutsideProd() {
  return {
    name: 'noindex-assets-outside-prod',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        if (process.env.CLOUDFLARE_ENV === 'prod') return
        const file = new URL('_headers', dir)
        const current = existsSync(file) ? await readFile(file, 'utf8') : ''
        const rule = '/*\n  X-Robots-Tag: noindex, nofollow\n'
        await writeFile(file, current ? `${current.trimEnd()}\n\n${rule}` : rule)
      },
    },
  }
}

const SITE_URL = 'https://jinglejam.ostof.dev'

/**
 * The pages the sitemap lists: canonical, indexable and 200 for everyone. All other routes stay out
 * (login, dashboard, admin, overlays, embeds, PWA, SSR/CSR variants, redirects, error pages).
 * Profiles, teams and schedules are dynamic routes the sitemap never sees; indexing them is undecided.
 */
const SITEMAP_PAGES = {
  '/': { changefreq: 'weekly', priority: 1 },
  '/yogs': { changefreq: 'daily', priority: 0.9 },
  '/community': { changefreq: 'daily', priority: 0.9 },
  '/community/schedule': { changefreq: 'daily', priority: 0.8 },
  '/teams': { changefreq: 'weekly', priority: 0.5 },
  '/yogs/stats': {},
  '/stream-resources': {},
  '/faq': {},
  '/about': {},
  '/twitch-extension': {},
  '/is-the-collection-live': {},
}
// Prerendered archive pages, one per visible schedule year.
const SITEMAP_ARCHIVE = /^\/yogs\/archive\/(\d{4})$/
const BUILD_TIME = new Date()

/** Path of a sitemap URL without a trailing slash (the root stays `/`). */
function sitemapPath(url) {
  return new URL(url).pathname.replace(/(.)\/$/, '$1')
}

/** Date of the last commit that touched an archive year's schedule; the build time without git. */
function archiveLastmod(year) {
  try {
    const date = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', `src/content/schedules/${year}.yaml`, `src/content/scheduleDays/${year}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim()
    return new Date(date || BUILD_TIME).toISOString()
  } catch {
    return BUILD_TIME.toISOString()
  }
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // One URL form: no trailing slash. Requests with a slash get a 301 to the form without it, and
  // prerendered pages are written as `<path>.html`, which the asset layer serves at `<path>`.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  security: {
    checkOrigin: true,
  },
  // Astro 7 defaults to 'jsx', which strips whitespace between inline elements. Keep the v6 output for now.
  compressHTML: true,
  integrations: [
    noindexAssetsOutsideProd(),
    solidJs(),
    sitemap({
      filenameBase: 'sitemap',
      lastmod: BUILD_TIME,
      // Astro passes `https://jinglejam.ostof.dev/` for the root and slashless URLs for the rest
      // (static routes plus the prerendered archive years).
      filter: (page) => {
        const path = sitemapPath(page)
        return Object.hasOwn(SITEMAP_PAGES, path) || SITEMAP_ARCHIVE.test(path)
      },
      serialize: (item) => {
        const path = sitemapPath(item.url)
        const year = SITEMAP_ARCHIVE.exec(path)?.[1]
        const entry = year
          ? { changefreq: 'yearly', priority: 0.7, lastmod: archiveLastmod(year) }
          : SITEMAP_PAGES[path]
        return { ...item, ...entry, url: `${SITE_URL}${path}` }
      },
    }),
  ],
  output: 'server',
  adapter: cloudflare({
    // Optimize images with sharp at build time (as Astro 5 did for prerendered pages); serve originals at runtime.
    imageService: 'compile',
  }),
  // The app keeps its own KV sessions (src/functions/session.ts) and never uses Astro.session.
  // A null driver stops the adapter from provisioning a SESSION KV binding.
  session: {
    driver: sessionDrivers.null(),
  },
  vite: {
    plugins: [tailwindcss(), excludeSolidDepsFromSsrOptimizer()],
    optimizeDeps: {
      include: ['debug', 'extend'],
    },
    resolve: {
      alias: {
        // debug: 'debug/src/browser.js', // Force the correct ESM file
      },
    },
  },
})
