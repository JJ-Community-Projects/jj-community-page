import { defineConfig, passthroughImageService } from 'astro/config'

import solidJs from '@astrojs/solid-js'

import cloudflare from '@astrojs/cloudflare'

import tailwind from '@astrojs/tailwind'

import sitemap from '@astrojs/sitemap'
import commonjs from 'vite-plugin-commonjs' // https://astro.build/config

// https://astro.build/config
export default defineConfig({
  site: 'https://jinglejam.ostof.dev',
  security: {
    checkOrigin: true,
  },
  integrations: [
    solidJs(),
    tailwind(),
    sitemap({
      filenameBase: 'sitemap',
      filter: (page) =>
        page !== 'https://jinglejam.ostof.dev/login/' &&
        page !== 'https://jinglejam.ostof.dev/admin/' &&
        page !== 'https://jinglejam.ostof.dev/faq/' &&
        page !== 'https://jinglejam.ostof.dev/about/' &&
        page !== 'https://jinglejam.ostof.dev/community-ssr/' &&
        !page.includes('404') &&
        !page.includes('error') &&
        !page.includes('/overlays/') &&
        !page.includes('/dashboard/') &&
        !page.includes('not-found') &&
        !page.includes('/api/') &&
        !page.includes('embed') &&
        page !== 'https://jinglejam.ostof.dev/yogs/privacy/twitch-extension/' &&
        !page.includes('pwa'),
      serialize: (item) => {
        const url = item.url
        if (url === 'https://jinglejam.ostof.dev/yogs/') {
          item.changefreq = 'daily'
          item.priority = 0.9
        }
        if (url === 'https://jinglejam.ostof.dev/community/') {
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
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
    },
  }),
  image: {
    service: passthroughImageService(),
  },
  vite: {
    plugins: [commonjs()],
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
  optimizeDeps: {
    include: ['debug', 'solid-markdown', 'extend'],
  },
  resolve: {
    alias: {
      debug: 'debug/src/browser.js',
      extend: 'extend/index.js',
    },
  },
  build: {
    exclude: ['.cache', 'node_modules'],
  },
})
