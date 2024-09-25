// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import remarkCodeImport from "remark-code-import"
import rehypeMermaid from "rehype-mermaid"
import starlightLinksValidator from "starlight-links-validator"
import path from "node:path"

/** @type {Parameters<typeof import("remark-code-import").default>[0]} */
const remarkCodeImportOptions = {
  rootDir: path.resolve("src/snippets")
}

/** @type {import("rehype-mermaid").RehypeMermaidOptions} */
const rehypeMermaidOptions = {
  strategy: "img-svg",
  dark: true
}

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [/** @type {any} */(remarkCodeImport), remarkCodeImportOptions]
    ],
    rehypePlugins: [
      [rehypeMermaid, rehypeMermaidOptions]
    ],
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark"
      }
    }
  },
  integrations: [
    starlight({
      title: "Effect Documentation",
      lastUpdated: true,
      editLink: {
        baseUrl: "https://github.com/Effect-TS/website/edit/main/docs/",
      },
      components: {
        Head: "./src/components/Head.astro"
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
      plugins: [
        starlightLinksValidator()
      ],
      sidebar: [
        { label: "Introduction", slug: "introduction" },
        { label: "Why Effect", slug: "why-effect" },
        { label: "Quickstart", slug: "quickstart" },
        {
          label: "Guides",
          items: [
            { label: "Essentials", autogenerate: { directory: "guides/essentials" }, collapsed: true },
            { label: "Error Management", autogenerate: { directory: "guides/error-management" }, collapsed: true },
            { label: "Requirements Management", autogenerate: { directory: "guides/context-management" }, collapsed: true },
            {
              label: "Resource Management",
              items: [
                { label: "Scope", slug: "guides/resource-management/scope" },
                { label: "Patterns", autogenerate: { directory: "guides/resource-management/patterns" }, collapsed: true }
              ],
              collapsed: true
            },
            {
              label: "Observability",
              items: [
                { label: "Logging", slug: "guides/observability/logging" },
                { label: "Supervisor", slug: "guides/observability/supervisor" },
                { label: "Telemetry", autogenerate: { directory: "guides/observability/telemetry" }, collapsed: true },
              ],
              collapsed: true
            },
            { label: "Configuration", slug: "guides/configuration" },
            { label: "Runtime", slug: "guides/runtime" },
            { label: "Scheduling", autogenerate: { directory: "guides/scheduling" }, collapsed: true },
            { label: "State Management", autogenerate: { directory: "guides/state-management" }, collapsed: true },
            { label: "Batching", slug: "guides/batching" },
            { label: "Caching", autogenerate: { directory: "guides/caching" }, collapsed: true },
            { label: "Concurrency", autogenerate: { directory: "guides/concurrency" }, collapsed: true },
            {
              label: "Streaming",
              items: [
                { label: "Stream", autogenerate: { directory: "guides/streaming/stream" }, collapsed: true },
                { label: "Sink", autogenerate: { directory: "guides/streaming/sink" }, collapsed: true },
                { label: "SubscriptionRef", slug: "guides/observability/logging" },
              ],
              collapsed: true
            },
            { label: "Testing", autogenerate: { directory: "guides/testing" }, collapsed: true },
            { label: "Control Flow", slug: "guides/control-flow" },
            { label: "Code Style", autogenerate: { directory: "guides/style" }, collapsed: true },
            {
              label: "Schema",
              items: [
                { label: "Introduction", slug: "guides/schema/introduction" },
                { label: "Getting Started", slug: "guides/schema/getting-started" },
                { label: "Basic Usage", slug: "guides/schema/basic-usage" },
                { label: "Projections", slug: "guides/schema/projections" },
                { label: "Transformations", slug: "guides/schema/transformations" },
                { label: "Annotations", slug: "guides/schema/annotations" },
                { label: "Error Messages", slug: "guides/schema/error-messages" },
                { label: "Error Formatters", slug: "guides/schema/error-formatters" },
                { label: "Class APIs", slug: "guides/schema/classes" },
                { label: "Default Constructors", slug: "guides/schema/default-constructors" },
                { label: "Effect Data Types", slug: "guides/schema/effect-data-types" },
                { label: "Schema to X", autogenerate: { directory: "guides/schema/schema-to-x" }, collapsed: true }
              ],
              collapsed: true
            },
            { label: "Platform", autogenerate: { directory: "guides/platform" }, collapsed: true },
          ]
        },
        {
          label: "Other",
          items: [
            { label: "Micro", autogenerate: { directory: "other/micro" }, collapsed: true },
            { label: "FAQ", slug: "other/faq" },
            { label: "Myths", slug: "other/myths" },
            { label: "Glossary", slug: "other/glossary" },
            { label: "Data Types", autogenerate: { directory: "other/data-types" }, collapsed: true },
            { label: "Traits", autogenerate: { directory: "other/trait" }, collapsed: true },
            { label: "Behaviours", autogenerate: { directory: "other/behaviour" }, collapsed: true },
            { label: "API Reference", slug: "other/api-reference" },
            { label: "Coming from ZIO", slug: "other/coming-from-zio" },
            { label: "Effect vs fp-ts", slug: "other/fp-ts" },
            { label: "Effect vs Promise", slug: "other/effect-vs-promise" },
          ]
        },
      ]
    }),
  ],
});
