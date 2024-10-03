import React from "react"
import { type RxWorkspaceHandle, workspaceHandleRx } from "../rx/workspace"
import { useRxSet, useRxSuspenseSuccess, useRxValue } from "@effect-rx/rx-react"
import { Workspace } from "../domain/workspace"

export const WorkspaceContext = React.createContext<RxWorkspaceHandle>(
  null as any
)

export const useWorkspaceHandle = () => React.useContext(WorkspaceContext)

export const useWorkspaceRx = () => useWorkspaceHandle().workspace

export const useWorkspace = () => useRxValue(useWorkspaceRx())
export const useSetWorkspace = () => useRxSet(useWorkspaceRx())

export const useWorkspaceShells = () =>
  useRxValue(useWorkspaceRx(), (workspace) => workspace.shells)

export const useWorkspaceTree = () =>
  useRxValue(useWorkspaceRx(), (workspace) => workspace.tree)

export function WorkspaceProvider({
  children,
  workspace
}: React.PropsWithChildren<{ readonly workspace: Workspace }>) {
  const handle = useRxSuspenseSuccess(workspaceHandleRx(workspace)).value
  return (
    <WorkspaceContext.Provider value={handle}>
      {children}
    </WorkspaceContext.Provider>
  )
}
