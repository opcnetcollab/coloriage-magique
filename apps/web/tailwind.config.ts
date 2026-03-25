import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Premium palette — The Curated Canvas ──────────────
        amber: {
          50:  "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        purple: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
        coral: {
          400: "#f472b6",
          500: "#ec4899",
        },
        warm: {
          50:  "#fffbf5",
          100: "#fff8f0",
          200: "#fef3e2",
          900: "#1c1917",
        },
        // ── Legacy surface system (kept for backward compat) ───
        primary: {
          amber:    "#F59E0B",
          purple:   "#A78BFA",
          pink:     "#F472B6",
          DEFAULT:  "#815100",
          container: "#f8a010",
          on:       "#fff0e3",
          dark:     "#815100",
        },
        secondary: {
          DEFAULT:      "#6448b2",
          container:    "#d8caff",
          on:           "#f7f0ff",
          "on-container": "#4f329d",
        },
        tertiary: {
          DEFAULT:   "#a02d70",
          container: "#ff8bc5",
          on:        "#ffeff3",
        },
        background: {
          cream: "#FFF8F0",
          soft:  "#FDF4FF",
        },
        surface: {
          DEFAULT: "#fcf5ed",
          lowest:  "#ffffff",
          low:     "#f7f0e7",
          mid:     "#eee7de",
          high:    "#e9e1d8",
          highest: "#e3dcd2",
          dim:     "#dbd3c9",
        },
        "on-surface": {
          DEFAULT: "#312e29",
          variant: "#5f5b55",
        },
        outline: {
          DEFAULT: "#7b7670",
          variant: "#b2aca5",
        },
        difficulty: {
          beginner:     "#22C55E",
          intermediate: "#EAB308",
          expert:       "#EF4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "3rem",
        full:  "9999px",
      },
      boxShadow: {
        // ── Premium amber/purple shadows ──────────────────────
        "amber-sm": "0 4px 20px rgba(217,119,6,0.12)",
        "amber-md": "0 10px 40px rgba(217,119,6,0.18)",
        "amber-lg": "0 20px 60px rgba(217,119,6,0.22)",
        "amber-xl": "0 30px 80px rgba(217,119,6,0.28)",
        "purple-md": "0 10px 40px rgba(124,58,237,0.18)",
        "purple-lg": "0 20px 60px rgba(124,58,237,0.22)",
        // ── Legacy shadows ────────────────────────────────────
        card:        "0 8px 40px 0 rgba(49,46,41,0.06)",
        float:       "0 20px 40px 0 rgba(49,46,41,0.06)",
        ghost:       "inset 0 0 0 1px rgba(123,118,112,0.15)",
        "glow-amber": "0 0 0 3px rgba(248,160,16,0.35), 0 12px 40px rgba(129,81,0,0.12)",
        "glow-purple": "0 0 0 3px rgba(167,139,250,0.35), 0 8px 24px rgba(100,72,178,0.12)",
      },
      animation: {
        drift:         "drift 4s ease-in-out infinite",
        sparkle:       "sparkle 1.5s ease-in-out infinite",
        float:         "float 3s ease-in-out infinite",
        shimmer:       "shimmer 2s linear infinite",
        "confetti-fall":    "confettiFall 1.2s ease-in forwards",
        "screen-enter":     "screenEnter 300ms ease-out",
        "magic-wand":       "magicWand 1s ease-in-out infinite",
        "sparkle-float":    "sparkleFloat 2s ease-out infinite",
        "pulse-border":     "pulseBorder 2s ease-in-out infinite",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)", opacity: "0.06" },
          "50%":      { transform: "translateY(-20px) rotate(5deg)", opacity: "0.10" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "50%":      { transform: "scale(1.15) rotate(10deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        confettiFall: {
          "0%":   { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        screenEnter: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        magicWand: {
          "0%":   { transform: "rotate(-15deg)" },
          "50%":  { transform: "rotate(15deg)" },
          "100%": { transform: "rotate(-15deg)" },
        },
        sparkleFloat: {
          "0%":   { opacity: "0", transform: "translateY(0) scale(0)" },
          "50%":  { opacity: "1", transform: "translateY(-20px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-40px) scale(0.5)" },
        },
        pulseBorder: {
          "0%, 100%": { borderColor: "rgba(251,191,36,0.5)" },
          "50%":      { borderColor: "rgba(217,119,6,0.9)" },
        },
      },
      backgroundImage: {
        "gradient-brand":   "linear-gradient(135deg, #F59E0B, #F472B6)",
        "gradient-canvas":  "linear-gradient(135deg, #d97706, #7c3aed)",
        "gradient-amber":   "linear-gradient(135deg, #f8a010, #F59E0B)",
        "shimmer-track": "linear-gradient(90deg, transparent 0%, rgba(255,240,227,0.6) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
