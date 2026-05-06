import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Colors ─────────────────────────────────────────────────────────────
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      // ── Border radius ───────────────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl:   "var(--radius)",                    // 0.75rem
        lg:   "calc(var(--radius) - 2px)",        // 0.625rem
        md:   "calc(var(--radius) - 4px)",        // 0.5rem
        sm:   "calc(var(--radius) - 6px)",        // 0.375rem
      },

      // ── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.025em",
        tight:    "-0.015em",
      },

      // ── Spacing ─────────────────────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },

      // ── Box shadows (mirrors globals.css CSS vars) ──────────────────────────
      boxShadow: {
        xs:      "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        sm:      "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        md:      "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.06)",
        lg:      "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 4px 10px -6px rgb(0 0 0 / 0.06)",
        xl:      "0 20px 40px -8px rgb(0 0 0 / 0.10), 0 8px 16px -8px rgb(0 0 0 / 0.06)",
        primary: "0 4px 16px hsl(var(--primary) / 0.30)",
        "primary-lg": "0 6px 20px hsl(var(--primary) / 0.40)",
        inner:   "inset 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        none:    "none",
      },

      // ── Transitions ─────────────────────────────────────────────────────────
      transitionDuration: {
        "0":   "0ms",
        "150": "150ms",
        "250": "250ms",
        "400": "400ms",
      },
      transitionTimingFunction: {
        "spring":     "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-out-back": "cubic-bezier(0.34, 1.3, 0.64, 1)",
      },

      // ── Animations ──────────────────────────────────────────────────────────
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-18px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
        pageIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)",    animationTimingFunction: "cubic-bezier(0.8,0,1,1)" },
          "50%":       { transform: "translateY(-4px)", animationTimingFunction: "cubic-bezier(0,0,0.2,1)" },
        },
      },
      animation: {
        "fade-in":       "fadeIn 0.4s ease-out forwards",
        "slide-up":      "slideUp 0.45s ease-out forwards",
        "slide-down":    "slideDown 0.35s ease-out forwards",
        "slide-in-right":"slideInRight 0.35s ease-out forwards",
        "scale-in":      "scaleIn 0.3s ease-out forwards",
        "marquee":       "marquee 28s linear infinite",
        "shimmer":       "shimmer 1.6s ease-in-out infinite",
        "page-in":       "pageIn 0.35s ease-out forwards",
      },

      // ── Background image helpers ─────────────────────────────────────────────
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":   "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient":
          "linear-gradient(135deg, hsl(221 83% 97%) 0%, hsl(262 83% 97%) 50%, hsl(199 89% 96%) 100%)",
        "surface-gradient":
          "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)",
      },

      // ── Z-index scale ────────────────────────────────────────────────────────
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },

      // ── Max-width ───────────────────────────────────────────────────────────
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ── Screens ─────────────────────────────────────────────────────────────
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;