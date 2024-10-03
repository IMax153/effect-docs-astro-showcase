import { useEffect, useMemo, useRef, Suspense } from "react"
import { useRxSuspenseSuccess } from "@effect-rx/rx-react"
import { WorkspaceShell } from "../domain/workspace"
import { useWorkspaceHandle } from "../context/workspace"

import "@xterm/xterm/css/xterm.css"

export function Terminal({ shell }: {
  readonly shell: WorkspaceShell
}) {
  return (
    <div className="relative z-0 h-full flex flex-col">
      <Suspense fallback={null}>
        <div className="flex-1 overflow-hidden">
          <Shell shell={shell} />
        </div>
      </Suspense>
    </div>
  )
}

function Shell({ shell }: {
  readonly shell: WorkspaceShell
}) {
  const ref = useRef<HTMLDivElement>(null)
  const handle = useWorkspaceHandle()
  const rx = useMemo(() => handle.terminal(shell), [handle, shell])
  const terminal = useRxSuspenseSuccess(rx).value

  useEffect(() => {
    terminal.open(ref.current!)
  }, [terminal])

  return <div ref={ref} id="terminal" className="h-full" />
}
