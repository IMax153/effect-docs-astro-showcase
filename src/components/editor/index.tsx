import { useCallback, Fragment, Suspense } from "react"
import { useRxSet } from "@effect-rx/rx-react"
import * as Hash from "effect/Hash"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable"
import { Toaster } from "@/components/ui/toaster"
import { FileEditor } from "./components/file-editor"
import { PlaygroundLoader } from "./components/loader"
import { Terminal } from "./components/terminal"
import { WorkspaceProvider } from "./context/workspace"
import {
  useWorkspaceHandle,
  useWorkspaceShells
} from "./context/workspace"
import {
  makeDirectory,
  makeFile,
  Workspace,
  WorkspaceShell
} from "./domain/workspace"
import { FileExplorer } from "./components/file-explorer"
import { TooltipProvider } from "../ui/tooltip"

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
  snapshots: Array.from({ length: 10 }, (_, i) => `snapshot-${i}`),
  tree: [
    makeDirectory("src", [
      makeFile(
        "main.ts",
        `import { NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"

const program = Effect.gen(function*() {
  yield* Effect.log("Welcome to the Effect Playground!")
})

program.pipe(NodeRuntime.runMain)
`),
    ])
  ]
})

export function CodeEditor() {
  return (
    <TooltipProvider>
      <PlaygroundLoader />
      <Suspense>
        <WorkspaceProvider workspace={defaultWorkspace}>
          <CodeEditorSuspended />
        </WorkspaceProvider>
      </Suspense>
      <Toaster />
    </TooltipProvider>
  )
}

function CodeEditorSuspended() {
  const { terminalSize } = useWorkspaceHandle()
  const setSize = useRxSet(terminalSize)
  const onResize = useCallback(
    function(..._: any) {
      setSize()
    },
    [setSize]
  )
  return (
    <ResizablePanelGroup autoSaveId="editor" direction="vertical">
      <ResizablePanel>
        <ResizablePanelGroup autoSaveId="sidebar" direction="horizontal">
          <ResizablePanel defaultSize={20}>
            <FileExplorer />
          </ResizablePanel>
          <ResizableHandle direction="vertical" />
          <ResizablePanel>
            <FileEditor />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle direction="horizontal" />

      <ResizablePanel defaultSize={30} onResize={onResize}>
        <WorkspaceShells />
      </ResizablePanel>

    </ResizablePanelGroup>
  )
}

function WorkspaceShells() {
  const { terminalSize } = useWorkspaceHandle()
  const shells = useWorkspaceShells()
  const setSize = useRxSet(terminalSize)
  const onResize = useCallback(
    function(..._: any) {
      setSize()
    },
    [setSize]
  )
  return (
    <>
      {shells.map((shell, index) => {
        const hash = Hash.hash(shell).toString()
        return (
          <Fragment key={hash}>
            <Terminal shell={shell} />
          </Fragment>
        )
      })}
    </>
  )
}
