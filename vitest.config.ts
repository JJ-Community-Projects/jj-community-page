import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'

// Tests run against local bindings only: never load the local `.env` secrets into the test env.
process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false'

const root = import.meta.dirname
const fromRoot = (p: string) => path.resolve(root, p)

// The same files `wrangler d1 migrations apply` uses, applied to the test D1 in name order.
const migrations = await readD1Migrations(fromRoot('drizzle'))

// Prod-shaped, sanitised seed (one INSERT per line, parents before children); loaded on demand by loadSeed().
const seed = fs
  .readFileSync(fromRoot('test/fixtures/seed.sql'), 'utf8')
  .split('\n')
  .filter((line) => line.startsWith('INSERT'))

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

// The e2e project runs the built app with the config `astro build` generates, minus:
// - `vars`: they carry secret values; testVars replaces them;
// - the `.dev.vars` the build copies next to it: wrangler loads that file from the config's folder,
//   so the copy goes to `dist/e2e/` (same depth, so its relative paths still resolve);
// - `no_bundle` / `rules`: with them the plugin loads test-side dependencies (msw) as their Node builds.
const builtConfig = fromRoot('dist/server/wrangler.json')
const e2eConfig = fromRoot('dist/e2e/wrangler.json')
const hasBuild = fs.existsSync(builtConfig)
if (hasBuild) {
  const { vars, no_bundle, rules, ...config } = JSON.parse(
    fs.readFileSync(builtConfig, 'utf8'),
  )
  fs.mkdirSync(path.dirname(e2eConfig), { recursive: true })
  fs.writeFileSync(e2eConfig, JSON.stringify({ ...config, vars: {} }, null, 2))
}

// `workers` / `workers-ws` run the source worker without Astro; `e2e` runs the built app
// (`astro build` output: real Astro handler, middleware, pages and content).
const workersPool = ({ built = false } = {}) =>
  cloudflareTest({
    main: built
      ? fromRoot('dist/server/entry.mjs')
      : fromRoot('test/workers/entry.ts'),
    wrangler: { configPath: built ? e2eConfig : fromRoot('wrangler.jsonc') },
    miniflare: {
      bindings: { ...testVars, TEST_MIGRATIONS: migrations, TEST_SEED: seed },
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
      // Needs `astro build` first (`npm run test:e2e`), so it only exists once there is a build.
      // The aliases only affect test-side imports; the built bundle has its Astro modules compiled in.
      ...(hasBuild
        ? [
            {
              plugins: [workersPool({ built: true })],
              resolve: { alias: astroStubs },
              test: {
                name: 'e2e',
                include: ['test/e2e/**/*.test.ts'],
                setupFiles: ['test/workers/setup.ts'],
                sequence: { groupOrder: 2 },
              },
            },
          ]
        : []),
    ],
  },
})
