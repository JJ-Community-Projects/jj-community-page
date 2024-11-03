import {defineConfig} from 'astro/config';

import solidJs from '@astrojs/solid-js';

import cloudflare from '@astrojs/cloudflare';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
    security: {
        checkOrigin: true
    },
    integrations: [solidJs(), tailwind()],
    output: 'server',
    adapter: cloudflare({
        imageService: 'passthrough'
    })
});
