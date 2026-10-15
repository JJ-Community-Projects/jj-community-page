import { defineConfig, sessionDrivers } from 'astro/config'

import solidJs from '@astrojs/solid-js'

import cloudflare from '@astrojs/cloudflare'

import sitemap from '@astrojs/sitemap'

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

// https://astro.build/config
export default defineConfig({
  site: 'https://jinglejam.ostof.dev',
  security: {
    checkOrigin: true,
  },
  // Astro 7 defaults to 'jsx', which strips whitespace between inline elements. Keep the v6 output for now.
  compressHTML: true,
  integrations: [
    solidJs(),
    sitemap({
      filenameBase: 'sitemap',
      /*
      customPages: [
        'https://jinglejam.ostof.dev',
        'https://jinglejam.ostof.dev/yogs',
        'https://jinglejam.ostof.dev/community',
        'https://jinglejam.ostof.dev/stream-resources',
        'https://jinglejam.ostof.dev/teams',
      ],*/
      filter: (page) => {
        return (
          page !== 'https://jinglejam.ostof.dev/login/' &&
          page !== 'https://jinglejam.ostof.dev/admin/' &&
          page !== 'https://jinglejam.ostof.dev/faq' &&
          page !== 'https://jinglejam.ostof.dev/about' &&
          page !== 'https://jinglejam.ostof.dev/community-ssr/' &&
          page !== 'https://jinglejam.ostof.dev/twitch-extension/' &&
          page !== 'https://jinglejam.ostof.dev/fundraisers/' &&
          page !== 'https://jinglejam.ostof.dev/users/' &&
          page !== 'https://jinglejam.ostof.dev/yogs/placeholder/' &&
          !page.includes('404') &&
          !page.includes('/ssr') &&
          !page.includes('/csr') &&
          !page.includes('error') &&
          !page.includes('/overlays/') &&
          !page.includes('/dashboard/') &&
          !page.includes('not-found') &&
          !page.includes('/api/') &&
          !page.includes('embed') &&
          page !==
            'https://jinglejam.ostof.dev/yogs/privacy/twitch-extension/' &&
          !page.includes('pwa')
        )
      },
      serialize: (item) => {
        let url = item.url
        if (url.endsWith("/")) {
          url = url.slice(0, -1);
          item.url = url
        }
        if (url === 'https://jinglejam.ostof.dev/yogs') {
          item.changefreq = 'daily'
          item.priority = 0.9
        }
        if (url === 'https://jinglejam.ostof.dev/community') {
          item.changefreq = 'daily'
          item.priority = 0.9
        }
        if (url === 'https://jinglejam.ostof.dev/teams/') {
          item.changefreq = 'weekly'
          item.priority = 0.5
        }
        return item
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
    plugins: [excludeSolidDepsFromSsrOptimizer()],
    optimizeDeps: {
      include: ['debug', 'extend'],
    },
    resolve: {
      alias: {
        // debug: 'debug/src/browser.js', // Force the correct ESM file
      },
    },
    build: {
      minify: false,
    },
  },
})
