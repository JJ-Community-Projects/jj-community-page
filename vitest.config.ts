import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'

// Tests run against local bindings only: never load the local `.env` secrets into the test env.
process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'

const root = import.meta.dirname
const fromRoot = (p: string) => path.resolve(root, p)

// The same files `wrangler d1 migrations apply` uses, applied to the test D1 in name order.
const migrations = await readD1Migrations(fromRoot('drizzle'))

// Astro virtual modules and the Astro request handler don't exist outside an Astro build.
const astroStubs = {
  'astro:content': fromRoot('test/stubs/astro-content.ts'),
  'astro:middleware': fromRoot('test/stubs/astro-middleware.ts'),
  '@astrojs/cloudflare/handler': fromRoot(
    'test/stubs/astro-cloudflare-handler.ts',
  ),
}

// Replace every `vars` value from wrangler.jsonc with a dummy, so no real credential reaches a test.
const testVars = {
  ENVIRONMENT: 'test',
  TWITCH_CLIENT_ID: 'test-twitch-client-id',
  TWITCH_CLIENT_SECRET: 'test-twitch-client-secret',
  TILTIFY_CLIENT_ID: 'test-tiltify-client-id',
  TILTIFY_SECRET: 'test-tiltify-secret',
  TILTIFY_API: 'https://tiltify.test',
  TILTIFY_REDIRECT_URI: 'http://localhost:3000/api/auth/tiltify/callback',
  JJ_DASHBOARD_URL: 'https://jj-dashboard.test',
  YOUTUBE_API_KEY: 'test-youtube-api-key',
  ORPC_DEI_SIGNING_KEY: 'test-orpc-dei-signing-key',
}

const workersPool = () =>
  cloudflareTest({
    main: fromRoot('test/workers/entry.ts'),
    wrangler: { configPath: fromRoot('wrangler.jsonc') },
    miniflare: {
      bindings: { ...testVars, TEST_MIGRATIONS: migrations },
      // No test may reach the real network; external APIs are mocked inside the worker.
      outboundService: (request: Request) =>
        new Response(
          `Outbound request blocked in tests: ${request.method} ${request.url}`,
          {
            status: 599,
          },
        ),
    },
  })

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        plugins: [workersPool()],
        resolve: { alias: astroStubs },
        test: {
          name: 'workers',
          include: ['test/workers/**/*.test.ts'],
          setupFiles: ['test/workers/setup.ts'],
        },
      },
      {
        // Durable Object WebSockets need shared storage and serial execution.
        plugins: [workersPool()],
        resolve: { alias: astroStubs },
        test: {
          name: 'workers-ws',
          include: ['test/workers-ws/**/*.test.ts'],
          setupFiles: ['test/workers/setup.ts'],
          maxWorkers: 1,
          isolate: false,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
})
