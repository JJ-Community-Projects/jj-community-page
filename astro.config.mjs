import {defineConfig} from 'astro/config';

import solidJs from '@astrojs/solid-js';

import cloudflare from '@astrojs/cloudflare';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';
import commonjs from 'vite-plugin-commonjs';

// https://astro.build/config
export default defineConfig({
    site: 'https://jinglejam.ostof.dev',
    security: {
        checkOrigin: true
    },
    integrations: [solidJs(), tailwind(), sitemap(
        {
            filter: (page) => page !== 'https://jinglejam.ostof.dev/login/' &&
                page !== 'https://jinglejam.ostof.dev/faq/' &&
                page !== 'https://jinglejam.ostof.dev/about/' &&
                page !== 'https://jinglejam.ostof.dev/overlays/charities/' &&
                page !== 'https://jinglejam.ostof.dev/overlays/charities2/' &&
                page !== 'https://jinglejam.ostof.dev/overlays/fundraisers/' &&
                page !== 'https://jinglejam.ostof.dev/yogs/schedules/404/' &&
                page !== 'https://jinglejam.ostof.dev/yogs/privacy/twitch-extension' &&
                !page.includes('pwa'),
        }
    )],
    output: 'server',
    adapter: cloudflare({
        imageService: 'passthrough'
    }),
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
});
