import {defineConfig} from 'astro/config';

import solidJs from '@astrojs/solid-js';

import cloudflare from '@astrojs/cloudflare';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

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
                page !== 'https://jinglejam.ostof.dev/yogs/privacy/twitch-extension',
        }
    )],
    output: 'server',
    adapter: cloudflare({
        imageService: 'passthrough'
    })
});
