import fluid, {extract, screens} from 'fluid-tailwind'

const {fontFamily} = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', extract],

    theme: {
        screens,
        extend: {
            fontFamily: {
                poppins: ['Poppins'],
                babas: ['Bebas'],
                sans: ['Inter', ...fontFamily.sans],
            },

            fontSize: {
                xxs: [
                    '0.625rem;',
                    {
                        lineHeight: '0.75rem',
                    },
                ],
            },
            colors: {
                overlay: '#ffffff05',
                primary: {
                    DEFAULT: '#E30E50',
                    shade: '#57051f',
                    50: '#FAAFC6',
                    100: '#F99BB8',
                    200: '#F6759D',
                    300: '#F44E82',
                    400: '#F22867',
                    500: '#E30E50',
                    600: '#AE0B3D',
                    700: '#79072B',
                    800: '#440418',
                    900: '#100106',
                    950: '#000000',
                },
                accent: {
                    DEFAULT: '#3584BF',
                    shade: '#09437a',
                    50: '#BED9ED',
                    100: '#AFD0E9',
                    200: '#8FBDE0',
                    300: '#6FAAD7',
                    400: '#4F98CE',
                    500: '#3584BF',
                    600: '#296693',
                    700: '#1D4767',
                    800: '#10293B',
                    900: '#040B0F',
                    950: '#000000',
                },
                twitch: {
                    DEFAULT: '#9146FF',
                    50: '#FEFEFF',
                    100: '#F2E9FF',
                    200: '#DAC0FF',
                    300: '#C298FF',
                    400: '#A96FFF',
                    500: '#9146FF',
                    600: '#700EFF',
                    700: '#5600D5',
                    800: '#40009D',
                    900: '#290065',
                },
                youtube: {
                    DEFAULT: '#FF0000',
                    50: '#FFB8B8',
                    100: '#FFA3A3',
                    200: '#FF7A7A',
                    300: '#FF5252',
                    400: '#FF2929',
                    500: '#FF0000',
                    600: '#C70000',
                    700: '#8F0000',
                    800: '#570000',
                    900: '#1F0000',
                    950: '#030000',
                },
                reddit: {
                    DEFAULT: '#FF4500',
                    50: '#FFCBB8',
                    100: '#FFBCA3',
                    200: '#FF9E7A',
                    300: '#FF8152',
                    400: '#FF6329',
                    500: '#FF4500',
                    600: '#C73600',
                    700: '#8F2700',
                    800: '#571700',
                    900: '#1F0800',
                },
                discord: {
                    DEFAULT: '#5865F2',
                    50: '#FFFFFF',
                    100: '#EFF1FE',
                    200: '#CACEFB',
                    300: '#A4ABF8',
                    400: '#7E88F5',
                    500: '#5865F2',
                    600: '#2435EE',
                    700: '#101FCA',
                    800: '#0C1796',
                    900: '#080F62',
                },
                github: {
                    DEFAULT: '#4078C0',
                    50: '#CADAEE',
                    100: '#BBCFE8',
                    200: '#9CB9DE',
                    300: '#7DA3D4',
                    400: '#5F8ECA',
                    500: '#4078C0',
                    600: '#325E96',
                    700: '#24436C',
                    800: '#162942',
                    900: '#080F18',
                },


                'yogs-primary': {
                    DEFAULT: '#1E95EF',
                    50: '#C9E6FB',
                    100: '#B6DDFA',
                    200: '#90CBF7',
                    300: '#6AB9F4',
                    400: '#44A7F2',
                    500: '#1E95EF',
                    600: '#0E77C7',
                    700: '#0A5892',
                    800: '#07385E',
                    900: '#03192A',
                },
                'yogs-accent': {
                    DEFAULT: '#F67932',
                    50: '#FEECE2',
                    100: '#FDDFCE',
                    200: '#FBC6A7',
                    300: '#F9AC80',
                    400: '#F89359',
                    500: '#F67932',
                    600: '#E65A0A',
                    700: '#B04508',
                    800: '#7A3005',
                    900: '#451B03',
                },
            },
            backgroundImage: {
                jj_background: "url('images/scheduleOverlay/Jingle_Jam_Background_Greyscale.png')",
                jj_background_2: "url('images/scheduleOverlay/Jingle_Jam_Background_Greyscale_2.png')",
                jj_background_3: "url('images/scheduleOverlay/Jingle_Jam_Background_Greyscale_3.png')",
                jj_background_4: "url('images/scheduleOverlay/Jingle_Jam_Background_Greyscale_4.png')",
            },
        },
    },
    plugins: [
        fluid,
        require("@tailwindcss/container-queries"),
        require('tailwind-scrollbar'),
        require('@tailwindcss/typography')
    ],
}
