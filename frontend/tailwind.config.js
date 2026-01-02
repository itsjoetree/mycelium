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
                    deep: 'var(--bg-deep)',
                    base: 'var(--bg-base)',
                    surface: 'var(--bg-surface)',
                },
                primary: {
                    DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
                    dirty: 'var(--accent-border)',
                    glow: 'var(--accent-glow)',
                    border: 'var(--accent-border)',
                },
                secondary: {
                    DEFAULT: '#bf00ff',
                },
                tertiary: {
                    DEFAULT: '#ff0055',
                },
                text: {
                    main: 'var(--text-main)',
                    muted: 'var(--text-muted)',
                },
                glass: {
                    surface: 'var(--glass-surface)',
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
