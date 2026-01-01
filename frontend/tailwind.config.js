/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    deep: '#051412',
                    base: '#0a1f1c',
                    surface: '#112926',
                },
                primary: {
                    DEFAULT: '#00ff9d',
                    dirty: 'rgba(0, 255, 157, 0.2)', // For glass borders
                },
                secondary: {
                    DEFAULT: '#bf00ff',
                },
                tertiary: {
                    DEFAULT: '#ff0055',
                },
                text: {
                    main: '#e0f2f0',
                    muted: '#8da6a3',
                },
                glass: {
                    surface: 'rgba(17, 41, 38, 0.6)',
                }
            },
            fontFamily: {
                display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            borderRadius: {
                sm: '4px',
                md: '12px',
                full: '999px',
            },
            backgroundImage: {
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
            }
        },
    },
    plugins: [],
}
