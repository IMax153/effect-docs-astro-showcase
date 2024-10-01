import {
  definePlugin,
  ExpressiveCodeAnnotation,
  type AnnotationRenderOptions,
  type AnnotationBaseOptions
} from "@expressive-code/core"
import { h } from "@expressive-code/core/hast"
import ts from "typescript"
import type {
  SourceFile,
  TextSpan,
  Node,
  CompilerOptions
} from "typescript"
import {
  createFSBackedSystem,
  createVirtualTypeScriptEnvironment
} from "@typescript/vfs"
import path from "path"

class TwoSlashAnnotation extends ExpressiveCodeAnnotation {
  constructor(annotation: AnnotationBaseOptions, readonly title: string) {
    super(annotation)
  }
  render({ nodesToTransform }: AnnotationRenderOptions) {
    return nodesToTransform.map((node) => {
      return h(
        "span.twoslash",
        {
          title: this.title
        },
        node
      )
    })
  }
}

const defaultCompilerOptions: CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  exactOptionalPropertyTypes: true,
  downlevelIteration: true,
  skipLibCheck: true,
  lib: ["ES2022", "DOM", "DOM.Iterable"],
  noEmit: true
}

const vfs = new Map<string, string>()
const system = createFSBackedSystem(
  vfs,
  process.cwd().split(path.sep).join(path.posix.sep),
  ts
)
const env = createVirtualTypeScriptEnvironment(
  system,
  [],
  ts,
  defaultCompilerOptions
)
const ls = env.languageService
let filenameCounter = 0

export default function pluginCodeOutput() {
  return definePlugin({
    name: "@plugins/twoslash",
    baseStyles: `
    .twoslash:hover {
      text-decoration-line: underline;
    }
    `,
    hooks: {
      preprocessCode(context) {
        if (!context.codeBlock.metaOptions.getBoolean("twoslash")) {
          return
        }
        const filename =
          context.codeBlock.metaOptions.getString("file") ??
          `twoslash-${filenameCounter++}.ts`
        const file = context.codeBlock.code
        env.createFile(filename, file)
        const errs = ls
          .getSemanticDiagnostics(filename)
          .concat(ls.getSyntacticDiagnostics(filename))
        if (errs.length) {
          return
        }
        // if (errs.length) {
        //   const diagnostics = errs.map((err) => {
        //     const message = ts.flattenDiagnosticMessageText(
        //       err.messageText,
        //       "\n"
        //     )
        //     return `${message} at ${err.file!.fileName}:${err.start}`
        //   })
        //   throw new Error(diagnostics.join("\n") + "\n\n" + file)
        // }
        const sourceFile = env.getSourceFile(filename)!
        const identifiers = getIdentifierTextSpans(sourceFile)
        for (const identifier of identifiers) {
          const span = identifier.span
          const quickInfo = ls.getQuickInfoAtPosition(filename, span.start)
          if (quickInfo && quickInfo.displayParts) {
            const text = quickInfo.displayParts
              .map((dp) => dp.text)
              .join("")
            const docs = quickInfo.documentation
              ? quickInfo.documentation.map((d) => d.text).join("\n")
              : undefined
            // Use TypeScript to pull out line/char from the original code at the position
            const burnerSourceFile = ts.createSourceFile(
              "_.ts",
              file,
              ts.ScriptTarget.ES2022
            )
            const { line, character } = ts.getLineAndCharacterOfPosition(
              burnerSourceFile,
              span.start
            )
            const ecLine = context.codeBlock.getLine(line)
            if (ecLine) {
              ecLine.addAnnotation(
                new TwoSlashAnnotation(
                  {
                    inlineRange: {
                      columnStart: character,
                      columnEnd: character + span.length
                    }
                  },
                  text + (docs ? `\n\n${docs}` : "")
                )
              )
            }
          }
        }
      }
    }
  })
}

function getIdentifierTextSpans(sourceFile: SourceFile) {
  const textSpans: { span: TextSpan; text: string }[] = []
  checkChildren(sourceFile)
  return textSpans

  function checkChildren(node: Node) {
    ts.forEachChild(node, (child) => {
      if (ts.isIdentifier(child)) {
        const start = child.getStart(sourceFile, false)
        textSpans.push({
          span: ts.createTextSpan(start, child.end - start),
          text: child.getText(sourceFile)
        })
      }
      checkChildren(child)
    })
  }
}
