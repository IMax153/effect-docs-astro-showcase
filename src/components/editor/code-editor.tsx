import { useCallback, Fragment, Suspense } from "react";
import * as Hash from "effect/Hash"
import { useRxSet } from "@effect-rx/rx-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileEditor } from "./components/file-editor"
import { FileExplorer } from "./components/file-explorer"
import {
  useWorkspaceHandle,
  useWorkspaceShells,
  WorkspaceProvider
} from "./context/workspace"
import {
  makeDirectory,
  makeFile,
  Workspace,
  WorkspaceShell
} from "./domain/workspace"
import { Terminal } from "./components/terminal"

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

export function CodeEditor({ workspace = defaultWorkspace }: {
  readonly workspace?: Workspace
}) {
  return (
    <Suspense fallback="Loading">
      <WorkspaceProvider workspace={workspace}>
        <CodeEditorSuspended />
      </WorkspaceProvider>
    </Suspense>
  )
}

function CodeEditorSuspended() {
  return (
    <TooltipProvider>
      <ResizablePanelGroup autoSaveId="editor" direction="vertical">
        <ResizablePanel>
          <ResizablePanelGroup autoSaveId="sidebar" direction="horizontal">
            <ResizablePanel
              defaultSize={20}
              className="bg-gray-50 dark:bg-neutral-900 min-w-[200px] flex flex-col"
            >
              <FileExplorer />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <FileEditor />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        <WorkspaceShells />
      </ResizablePanelGroup>
      <Toaster />
    </TooltipProvider>
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
    <ResizablePanel defaultSize={30} onResize={onResize}>
      <ResizablePanelGroup
        direction="horizontal"
        className="border-y border-neutral-300 dark:border-neutral-700"
      >
        {shells.map((shell, index) => {
          const hash = Hash.hash(shell).toString()
          return (
            <Fragment key={hash}>
              {index > 0 && <ResizableHandle id={hash} />}
              <ResizablePanel id={hash} className="h-full" order={index} onResize={onResize}>
                <Terminal shell={shell} />
              </ResizablePanel>
            </Fragment>
          )
        })
        }
      </ResizablePanelGroup>
    </ResizablePanel>
  )
}

