import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import rehypeMermaid, { type RehypeMermaidOptions } from "rehype-mermaid"
import starlightBlog from "starlight-blog"
import starlightLinksValidator from "starlight-links-validator"
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import { rehypeHeadingIds } from "@astrojs/markdown-remark"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import pluginTwoslash from "./src/plugins/twoslash/plugin"

/* https://docs.netlify.com/configure-builds/environment-variables/#read-only-variables */
const NETLIFY_PREVIEW_SITE =
  process.env.CONTEXT !== "production" && process.env.DEPLOY_PRIME_URL

const site = NETLIFY_PREVIEW_SITE || "https://effect.website"

const rehypeMermaidOptions: RehypeMermaidOptions = {
  strategy: "img-svg",
  dark: true
}

export default defineConfig({
  site,
  markdown: {
    rehypePlugins: [
      [rehypeMermaid, rehypeMermaidOptions],
      // the following two plugins are required for the autolink headings to work
      // the headings are styled in the headings.css file
      rehypeHeadingIds,
      [rehypeAutolinkHeadings, { behavior: "wrap" }]
    ]
  },
  integrations: [
    starlight({
      title: "Effect Documentation",
      lastUpdated: true,
      components: {
        Head: "./src/components/starlight-overrides/Head.astro"
      },
      customCss: [
        // the styles for the autolink headings
        "./src/styles/headings.css",
        // fixes overflow-wrap when the columns contains code blocks
        "./src/styles/tables.css",
        // fixes styles for astro-tweet
        "./src/styles/tweet.css",
        // the global styles required for Twoslash (the rest are scoped to the plugin)
        "./src/styles/twoslash.css",
      ],
      editLink: {
        baseUrl: "https://github.com/Effect-TS/website/edit/main/docs/"
      },
      expressiveCode: {
        plugins: [
          pluginCollapsibleSections(),
          pluginLineNumbers(),
          pluginTwoslash({ explicitTrigger: true })
        ],
        themes: ["github-light", "github-dark"]
      },
      favicon: "/favicon.png",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true
      },
      social: {
        discord: "https://discord.gg/effect-ts",
        github: "https://github.com/Effect-TS"
      },
      plugins: [
        starlightBlog({
          recentPostCount: 5,
          authors: {
            davide_scognamiglio: {
              name: "Davide Scognamiglio",
              title: "Project Manager",
              picture: "/authors/davide_scognamiglio.png",
              url: "https://twitter.com/DadeSkoTV"
            },
            guilio_canti: {
              name: "Guilio Canti",
              title: "Founding Engineer",
              picture: "/authors/guilio_canti.png",
              url: "https://github.com/gcanti"
            },
            maxwell_brown: {
              name: "Maxwell Brown",
              title: "Founding Engineer",
              picture: "/authors/maxwell_brown.png",
              url: "https://github.com/IMax153"
            },
            mirela_prifti: {
              name: "Mirela Prifti",
              title: "Community Manager",
              picture: "/authors/mirela_prifti.png",
              url: "https://twitter.com/mirepri4"
            },
            michael_arnaldi: {
              name: "Michael Arnaldi",
              title: "Chief Executive Officer",
              picture: "/authors/michael_arnaldi.png",
              url: "https://github.com/mikearnaldi"
            },
            tim_smart: {
              name: "Tim Smart",
              title: "Founding Engineer",
              picture: "/authors/tim_smart.png",
              url: "https://github.com/timsmart"
            }
          }
        }),
        starlightLinksValidator()
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "docs/getting-started" },
          collapsed: false
        },
        {
          label: "Error Management",
          autogenerate: { directory: "docs/error-management" },
          collapsed: false
        },
        {
          label: "Requirements Management",
          autogenerate: { directory: "docs/requirements-management" },
          collapsed: false
        },
        {
          label: "Resource Management",
          autogenerate: { directory: "docs/resource-management" },
          collapsed: false
        },
        {
          label: "Observability",
          autogenerate: { directory: "docs/observability" },
          collapsed: false
        },
        { label: "Configuration", slug: "docs/configuration" },
        { label: "Runtime", slug: "docs/runtime" },
        {
          label: "Scheduling",
          autogenerate: { directory: "docs/scheduling" },
          collapsed: false
        },
        {
          label: "State Management",
          autogenerate: { directory: "docs/state-management" },
          collapsed: false
        },
        { label: "Batching", slug: "docs/batching" },
        {
          label: "Caching",
          autogenerate: { directory: "docs/caching" },
          collapsed: false
        },
        {
          label: "Concurrency",
          autogenerate: { directory: "docs/concurrency" },
          collapsed: false
        },
        {
          label: "Stream",
          autogenerate: { directory: "docs/stream" },
          collapsed: false
        },
        {
          label: "Sink",
          autogenerate: { directory: "docs/sink" },
          collapsed: false
        },
        {
          label: "Testing",
          autogenerate: { directory: "docs/testing" },
          collapsed: false
        },
        {
          label: "Code Style",
          autogenerate: { directory: "docs/code-style" },
          collapsed: false
        },
        {
          label: "Data Types",
          autogenerate: { directory: "docs/data-types" },
          collapsed: false
        },
        {
          label: "Traits",
          autogenerate: { directory: "docs/trait" },
          collapsed: false
        },
        {
          label: "Behaviours",
          autogenerate: { directory: "docs/behaviour" },
          collapsed: false
        },
        {
          label: "Micro",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "docs/micro" },
          collapsed: false
        },
        {
          label: "Schema",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "docs/schema" },
          collapsed: false
        },
        {
          label: "Platform",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "docs/platform" },
          collapsed: false
        },
        {
          label: "Additional Resources",
          autogenerate: { directory: "docs/additional-resources" },
          collapsed: false
        }
      ]
    })
  ]
})
