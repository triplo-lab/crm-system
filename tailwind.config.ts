import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '-0.003em' }],
        'base': ['0.95rem', { lineHeight: '1.65', letterSpacing: '-0.005em' }],
        'lg': ['1.0625rem', { lineHeight: '1.65', letterSpacing: '-0.01em' }],
        'xl': ['1.1875rem', { lineHeight: '1.6', letterSpacing: '-0.015em' }],
        '2xl': ['1.375rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        '3xl': ['1.75rem', { lineHeight: '1.4', letterSpacing: '-0.025em' }],
        '4xl': ['2.125rem', { lineHeight: '1.3', letterSpacing: '-0.03em' }],
        '5xl': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.035em' }],
        '6xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
