/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // Zinc 950
                surface: "#18181b",    // Zinc 900
                surfaceHighlight: "#27272a", // Zinc 800
                border: "#3f3f46",     // Zinc 700
                primary: {
                    DEFAULT: "#6366f1",  // Indigo 500
                    hover: "#4f46e5",    // Indigo 600
                    glow: "rgba(99, 102, 241, 0.5)"
                },
                secondary: {
                    DEFAULT: "#a855f7",  // Purple 500
                    hover: "#9333ea",    // Purple 600
                },
                accent: {
                    DEFAULT: "#06b6d4", // Cyan 500
                },
                text: {
                    main: "#f4f4f5",    // Zinc 100
                    muted: "#a1a1aa",   // Zinc 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
