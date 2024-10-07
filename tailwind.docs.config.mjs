/**
 * This Tailwind configuration is intended for use on pages that **ARE** 
 * managed by Starlight. 
 *
 * Both Tailwind and Starlight have CSS resets which are incompatible with one
 * another. Although Starlight provides a plugin for Tailwind, what we really 
 * want is to avoid running Tailwind's builtin preflight CSS reset for pages 
 * that Starlight is already styling.
 * 
 * Therefore, we have two separate Tailwind configurations and two separate
 * Tailwind CSS files.
 *
 * The Tailwind CSS file located at `src/styles/tailwind.docs.css` is intended
 * for use on pages that **ARE** managed by Starlight, and this CSS file is 
 * already included in Starlight's `customCss` configuration field in the
 * `astro.config.mjs` file.
 *
 * The Tailwind CSS file located at `src/styles/tailwind.css` is intended for 
 * use on pages **NOT** managed by Starlight (e.g. anything that is not a 
 * `/docs` or `/blog` page). For these non-Starlight pages, the Tailwind CSS 
 * file must be imported.
 */

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  corePlugins: {
    preflight: false
  }
}
