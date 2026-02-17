import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  safelist: ["grid-cols-3", "grid-cols-4", "grid-cols-5", "grid-cols-6"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Bio-gradient colors
        bio: {
          teal: "hsl(var(--bio-teal))",
          blue: "hsl(var(--bio-blue))",
          purple: "hsl(var(--bio-purple))",
          pink: "hsl(var(--bio-pink))",
          orange: "hsl(var(--bio-orange))",
          gold: "hsl(var(--bio-gold))",
        },
        // Legacy neon colors (compatibility)
        neon: {
          cyan: "hsl(var(--neon-cyan))",
          "cyan-glow": "hsl(var(--neon-cyan-glow))",
          magenta: "hsl(var(--neon-magenta))",
          "magenta-glow": "hsl(var(--neon-magenta-glow))",
          gold: "hsl(var(--neon-gold))",
          "gold-glow": "hsl(var(--neon-gold-glow))",
        },
        cosmic: {
          purple: "hsl(var(--cosmic-purple))",
        },
        warning: "hsl(var(--warning))",
        success: "hsl(var(--success))",
        game: {
          math: "hsl(var(--game-math))",
          color: "hsl(var(--game-color))",
          memory: "hsl(var(--game-memory))",
          direction: "hsl(var(--game-direction))",
          pattern: "hsl(var(--game-pattern))",
        },
      },
      borderRadius: {
        lg: "24px",
        md: "16px",
        sm: "10px",
        xl: "32px",
        "2xl": "40px",
        "3xl": "48px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.02)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(var(--bio-teal) / 0.2)"
          },
          "50%": { 
            boxShadow: "0 0 35px hsl(var(--bio-teal) / 0.35)"
          },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-3px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(3px)" },
        },
        "score-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "ring-progress": {
          "0%": { strokeDashoffset: "440" },
          "100%": { strokeDashoffset: "var(--progress)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shake: "shake 0.4s cubic-bezier(.36,.07,.19,.97)",
        "score-pop": "score-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        float: "float 4s ease-in-out infinite",
        "ring-progress": "ring-progress 1.5s ease-out forwards",
        "fade-up": "fade-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
