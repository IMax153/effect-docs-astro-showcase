/**
 * This Tailwind configuration is intended for use on pages that are **NOT** 
 * managed by Starlight. 
 *
 * Both Tailwind and Starlight have CSS resets which are incompatible with one
 * another. Although Starlight provides a plugin for Tailwind, what we really 
 * want is to avoid running Tailwind"s builtin preflight CSS reset for pages 
 * that Starlight is already styling.
 * 
 * Therefore, we have two separate Tailwind configurations and two separate
 * Tailwind CSS files.
 *
 * The Tailwind CSS file located at `src/styles/tailwind.docs.css` is intended
 * for use on pages that **ARE** managed by Starlight, and this CSS file is 
 * already included in Starlight"s `customCss` configuration field in the
 * `astro.config.mjs` file.
 *
 * The Tailwind CSS file located at `src/styles/tailwind.css` is intended for 
 * use on pages **NOT** managed by Starlight (e.g. anything that is not a 
 * `/docs` or `/blog` page). For these non-Starlight pages, the Tailwind CSS 
 * file must be imported.
 */

/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "selector",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [require("tailwindcss-animate")],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))"
        }
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
    }
  }
}
