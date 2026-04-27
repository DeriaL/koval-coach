import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--accent) / 0.25), 0 10px 40px -10px rgb(var(--accent) / 0.45)",
        glow2: "0 10px 40px -10px rgb(var(--accent2) / 0.45)",
      },
      backgroundImage: {
        "grid": "radial-gradient(circle at 1px 1px, rgb(var(--text) / 0.06) 1px, transparent 0)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { opacity: "0", transform: "scale(.92)" },
          "60%": { opacity: "1", transform: "scale(1.02)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--accent) / 0.6)" },
          "100%": { boxShadow: "0 0 0 16px rgb(var(--accent) / 0)" },
        },
        "gradient-spin": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in .35s ease-out both",
        "fade-up": "fade-up .45s cubic-bezier(.2,.7,.2,1) both",
        "fade-down": "fade-down .35s cubic-bezier(.2,.7,.2,1) both",
        "pop": "pop .35s cubic-bezier(.2,.7,.2,1) both",
        "slide-in-right": "slide-in-right .35s cubic-bezier(.2,.7,.2,1) both",
        "slide-in-left": "slide-in-left .35s cubic-bezier(.2,.7,.2,1) both",
        "slide-in-up": "slide-in-up .4s cubic-bezier(.2,.7,.2,1) both",
        "shimmer": "shimmer 2.4s linear infinite",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        "gradient-spin": "gradient-spin 8s ease infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
