import { useCallback, Fragment, Suspense } from "react";
import * as Hash from "effect/Hash"
import { useRxSet } from "@effect-rx/rx-react";
import { FileEditor } from "./components/file-editor";
import {
  useWorkspaceHandle,
  useWorkspaceShells,
  WorkspaceProvider
} from "./context/workspace";
import { makeDirectory, makeFile, Workspace, WorkspaceShell } from "./domain/workspace";
import { Terminal } from "./components/terminal";

const defaultWorkspace = new Workspace({
  name: "playground",
  dependencies: {
    "@effect/experimental": "0.26.6",
    "@effect/platform": "0.65.5",
    "@effect/platform-node": "0.60.5",
    "@effect/schema": "0.73.4",
    "@types/node": "22.5.5",
    "effect": "3.8.3",
    "tsc-watch": "6.2.0",
    "typescript": "5.6.2"
  },
  shells: [new WorkspaceShell({ command: "../run src/main.ts" })],
  initialFilePath: "src/main.ts",
  tree: [
    // TODO: Revert this back to the old program
    makeDirectory("src", [
      makeFile(
        "main.ts",
        `import { NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { DevToolsLive } from "./DevTools"

const program = Effect.gen(function*() {
  yield* Effect.log("Welcome to the Effect Playground!")
}).pipe(Effect.withSpan("program", {
  attributes: { source: "Playground" }
}))

program.pipe(
  Effect.provide(DevToolsLive),
  NodeRuntime.runMain
)
`),
    ])
  ]
})

export function CodeEditor({ workspace = defaultWorkspace }: {
  readonly workspace?: Workspace
}) {
  return (
    <Suspense fallback="Loading...">
      <WorkspaceProvider workspace={workspace}>
        <CodeEditorSuspended />
      </WorkspaceProvider>
    </Suspense>
  )
}

function CodeEditorSuspended() {
  const handle = useWorkspaceHandle()
  const setSize = useRxSet(handle.terminalSize)
  const onResize = useCallback(
    function(..._: any) {
      setSize()
    },
    [setSize]
  )

  return (
    <>
      <FileEditor />
      <WorkspaceShells />
    </>
  )
}

function WorkspaceShells() {
  const handle = useWorkspaceHandle()
  const shells = useWorkspaceShells()
  const setSize = useRxSet(handle.terminalSize)
  const onResize = useCallback(
    function(..._: any) {
      setSize()
    },
    [setSize]
  )
  return (
    <>
      {shells.map((shell, index) => (
        <Fragment key={Hash.hash(shell)}>
          <Terminal shell={shell} />
        </Fragment >
      ))
      }
    </>
  )
}

