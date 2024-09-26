import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import rehypeMermaid, { type RehypeMermaidOptions } from "rehype-mermaid"
import starlightLinksValidator from "starlight-links-validator"
import path from "node:path"
import codeImportPlugin from "./src/plugins/code-import"

const rehypeMermaidOptions: RehypeMermaidOptions = {
  strategy: "img-svg",
  dark: true
}

export default defineConfig({
  markdown: {
    rehypePlugins: [[rehypeMermaid, rehypeMermaidOptions]],
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
      components: {
        Head: "./src/components/Head.astro"
      },
      customCss: [
        "./src/styles/custom.css"
      ],
      editLink: {
        baseUrl: "https://github.com/Effect-TS/website/edit/main/docs/"
      },
      expressiveCode: {
        plugins: [
          codeImportPlugin({
            rootDir: path.resolve("src/snippets")
          })
        ]
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
        { label: "Introduction", slug: "introduction" },
        { label: "Why Effect", slug: "why-effect" },
        { label: "Quickstart", slug: "quickstart" },
        {
          label: "Key Features",
          items: [
            {
              label: "Workflows",
              autogenerate: { directory: "workflows" },
              collapsed: true
            },
            {
              label: "Error Management",
              autogenerate: { directory: "guides/error-management" },
              collapsed: true
            },
            {
              label: "Requirements Management",
              autogenerate: { directory: "guides/context-management" },
              collapsed: true
            },
            {
              label: "Resource Management",
              items: [
                { label: "Scope", slug: "guides/resource-management/scope" },
                {
                  label: "Patterns",
                  autogenerate: {
                    directory: "guides/resource-management/patterns"
                  },
                  collapsed: true
                }
              ],
              collapsed: true
            },
            {
              label: "Observability",
              items: [
                { label: "Logging", slug: "guides/observability/logging" },
                {
                  label: "Supervisor",
                  slug: "guides/observability/supervisor"
                },
                {
                  label: "Telemetry",
                  autogenerate: {
                    directory: "guides/observability/telemetry"
                  },
                  collapsed: true
                }
              ],
              collapsed: true
            },
            { label: "Configuration", slug: "guides/configuration" },
            { label: "Runtime", slug: "guides/runtime" },
            {
              label: "Scheduling",
              autogenerate: { directory: "guides/scheduling" },
              collapsed: true
            },
            {
              label: "State Management",
              autogenerate: { directory: "guides/state-management" },
              collapsed: true
            },
            { label: "Batching", slug: "guides/batching" },
            {
              label: "Caching",
              autogenerate: { directory: "guides/caching" },
              collapsed: true
            },
            {
              label: "Concurrency",
              autogenerate: { directory: "guides/concurrency" },
              collapsed: true
            },
            {
              label: "Streaming",
              items: [
                {
                  label: "Stream",
                  autogenerate: { directory: "guides/streaming/stream" },
                  collapsed: true
                },
                {
                  label: "Sink",
                  autogenerate: { directory: "guides/streaming/sink" },
                  collapsed: true
                },
                {
                  label: "SubscriptionRef",
                  slug: "guides/observability/logging"
                }
              ],
              collapsed: true
            },
            {
              label: "Testing",
              autogenerate: { directory: "guides/testing" },
              collapsed: true
            },
            { label: "Control Flow", slug: "guides/control-flow" },
            {
              label: "Code Style",
              autogenerate: { directory: "guides/style" },
              collapsed: true
            },
            {
              label: "Data Types",
              autogenerate: { directory: "data-types" },
              collapsed: true
            },
            {
              label: "Traits",
              autogenerate: { directory: "trait" },
              collapsed: true
            },
            {
              label: "Behaviours",
              autogenerate: { directory: "behaviour" },
              collapsed: true
            }
          ]
        },
        {
          label: "Micro",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "micro" },
          collapsed: true
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
              collapsed: true
            }
          ],
          collapsed: true
        },
        {
          label: "Platform",
          badge: { text: "Unstable", variant: "caution" },
          autogenerate: { directory: "platform" },
          collapsed: true
        },
        {
          label: "Other",
          items: [
            { label: "FAQ", slug: "other/faq" },
            { label: "Myths", slug: "other/myths" },
            { label: "Glossary", slug: "other/glossary" },
            { label: "API Reference", slug: "other/api-reference" },
            { label: "Coming from ZIO", slug: "other/coming-from-zio" },
            { label: "Effect vs fp-ts", slug: "other/fp-ts" },
            { label: "Effect vs Promise", slug: "other/effect-vs-promise" }
          ]
        }
      ]
    })
  ]
})
