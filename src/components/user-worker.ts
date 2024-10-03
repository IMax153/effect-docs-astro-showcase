import * as monaco from "@effect/monaco-editor";
import EditorWorker from "@effect/monaco-editor/esm/vs/editor/editor.worker?worker";
import JSONWorker from "@effect/monaco-editor/esm/vs/language/json/json.worker?worker";
import CSSWorker from "@effect/monaco-editor/esm/vs/language/css/css.worker?worker";
import HTMLWorker from "@effect/monaco-editor/esm/vs/language/html/html.worker?worker";
import TSWorker from "@effect/monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new JSONWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new CSSWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new HTMLWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new TSWorker();
    }
    return new EditorWorker();
  }
};
