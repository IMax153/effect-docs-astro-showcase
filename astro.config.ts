import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import rehypeMermaid, { type RehypeMermaidOptions } from "rehype-mermaid"
import remarkCodeImport from "remark-code-import"
import starlightLinksValidator from "starlight-links-validator"
import * as path from "node:path"
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import { rehypeHeadingIds } from "@astrojs/markdown-remark"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
// import pluginCodeOutput from "./src/plugins/code-output"

/* https://docs.netlify.com/configure-builds/environment-variables/#read-only-variables */
const NETLIFY_PREVIEW_SITE =
  process.env.CONTEXT !== "production" && process.env.DEPLOY_PRIME_URL

const site = NETLIFY_PREVIEW_SITE || "https://effect.website"

const rehypeMermaidOptions: RehypeMermaidOptions = {
  strategy: "img-svg",
  dark: true
}

const remarkCodeImportOptions: Parameters<typeof remarkCodeImport>[0] = {
  rootDir: path.resolve("src/snippets")
}

export default defineConfig({
  site,
  markdown: {
    rehypePlugins: [
      [rehypeMermaid, rehypeMermaidOptions],
      rehypeHeadingIds,
      [rehypeAutolinkHeadings, { behavior: "wrap" }]
    ],
    remarkPlugins: [[remarkCodeImport as any, remarkCodeImportOptions]]
  },
  integrations: [
    starlight({
      title: "Effect Documentation",
      lastUpdated: true,
      editLink: {
        baseUrl: "https://github.com/Effect-TS/website/edit/main/docs/"
      },
      components: {
        Head: "./src/components/starlight-overrides/Head.astro"
      },
      customCss: ["./src/styles/headings.css"],
      expressiveCode: {
        plugins: [
          // commented out to make sure it doesn't interfere with the other plugins
          // pluginCodeOutput(),
          pluginCollapsibleSections(),
          pluginLineNumbers()
        ],
        themes: ["github-light", "github-dark"]
      },
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true
      },
      social: {
        discord: "https://discord.gg/effect-ts",
        github: "https://github.com/Effect-TS"
      },
      plugins: [starlightLinksValidator()],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
          collapsed: false
        },
        {
          label: "Error Management",
          autogenerate: { directory: "error-management" },
          collapsed: false
        },
        {
          label: "Requirements Management",
          autogenerate: { directory: "requirements-management" },
          collapsed: false
        },
        {
          label: "Resource Management",
          items: [
            { label: "Scope", slug: "resource-management/scope" },
            { label: "Patterns", slug: "resource-management/patterns" }
          ],
          collapsed: false
        },
        {
          label: "Observability",
          items: [
            { label: "Logging", slug: "observability/logging" },
            {
              label: "Supervisor",
              slug: "observability/supervisor"
            },
            {
              label: "Telemetry",
              autogenerate: {
                directory: "observability/telemetry"
              },
              collapsed: false
            }
          ],
          collapsed: false
        },
        { label: "Configuration", slug: "configuration" },
        { label: "Runtime", slug: "runtime" },
        {
          label: "Scheduling",
          autogenerate: { directory: "scheduling" },
          collapsed: false
        },
        {
          label: "State Management",
          autogenerate: { directory: "state-management" },
          collapsed: false
        },
        { label: "Batching", slug: "batching" },
        {
          label: "Caching",
          autogenerate: { directory: "caching" },
          collapsed: false
        },
        {
          label: "Concurrency",
          autogenerate: { directory: "concurrency" },
          collapsed: false
        },
        {
          label: "Stream",
          autogenerate: { directory: "stream" },
          collapsed: false
        },
        {
          label: "Sink",
          autogenerate: { directory: "sink" },
          collapsed: false
        },
        {
          label: "Testing",
          autogenerate: { directory: "testing" },
          collapsed: false
        },
        {
          label: "Code Style",
          autogenerate: { directory: "code-style" },
          collapsed: false
        },
        {
          label: "Data Types",
          autogenerate: { directory: "data-types" },
          collapsed: false
        },
        {
          label: "Traits",
          autogenerate: { directory: "trait" },
          collapsed: false
        },
        {
          label: "Behaviours",
          autogenerate: { directory: "behaviour" },
          collapsed: false
        },
        {
          label: "Micro",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "micro" },
          collapsed: false
        },
        {
          label: "Schema",
          badge: { text: "Unstable", variant: "caution" },
          items: [
            { label: "Introduction", slug: "schema/introduction" },
            {
              label: "Getting Started",
              slug: "schema/getting-started"
            },
            { label: "Basic Usage", slug: "schema/basic-usage" },
            { label: "Projections", slug: "schema/projections" },
            {
              label: "Transformations",
              slug: "schema/transformations"
            },
            { label: "Annotations", slug: "schema/annotations" },
            {
              label: "Error Messages",
              slug: "schema/error-messages"
            },
            {
              label: "Error Formatters",
              slug: "schema/error-formatters"
            },
            { label: "Class APIs", slug: "schema/classes" },
            {
              label: "Default Constructors",
              slug: "schema/default-constructors"
            },
            {
              label: "Effect Data Types",
              slug: "schema/effect-data-types"
            },
            {
              label: "Schema to X",
              autogenerate: { directory: "schema/schema-to-x" },
              collapsed: false
            }
          ],
          collapsed: false
        },
        {
          label: "Platform",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "platform" },
          collapsed: false
        },
        {
          label: "Additional Resources",
          autogenerate: { directory: "additional-resources" },
          collapsed: false
        }
      ]
    })
  ]
})
