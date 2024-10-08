import { useCallback, useMemo } from "react"
import { Rx, useRxSet, useRxValue } from "@effect-rx/rx-react"
import * as Data from "effect/Data"
import { useWorkspaceHandle, useWorkspaceTree } from "../context/workspace"
import { File, Directory } from "../domain/workspace"
import { editorRx, type Editor } from "../rx/editor"
import { FileTree } from "./file-explorer/file-tree"

export declare namespace FileExplorer {
  export type State = Data.TaggedEnum<{
    readonly Idle: {}
    readonly Creating: {
      readonly parent: Directory
      readonly type: Editor.FileType
    }
    readonly Editing: {
      readonly node: Directory | File
    }
  }>
}

export const State = Data.taggedEnum<FileExplorer.State>()
export const stateRx = Rx.make<FileExplorer.State>(State.Idle())

export const useExplorerState = () => useRxValue(stateRx)

export const useExplorerDispatch = () => useRxSet(stateRx)

export const useCreate = () => {
  const handle = useWorkspaceHandle()
  const { editor } = useMemo(() => editorRx(handle), [handle])
  // const create = useRxSet(editor.)
  const dispatch = useExplorerDispatch()
  return useCallback(
    (parent: Directory, name: string, type: Editor.FileType) => {
      // create([Option.some(parent), name, type])
      dispatch(State.Idle())
    },
    [/* create */, dispatch]
  )
}

export const useRename = () => {
  const handle = useWorkspaceHandle()
  // const rename = useRxSet(handle.rename)
  const dispatch = useExplorerDispatch()
  return useCallback(
    (node: File | Directory, name: string) => {
      // rename([node, name])
      dispatch(State.Idle())
    },
    [/* rename */, dispatch]
  )
}

export const useRemove = () => {
  const handle = useWorkspaceHandle()
  // const remove = useRxSet(handle.remove)
  const dispatch = useExplorerDispatch()
  return useCallback(
    (node: File | Directory) => {
      // remove(node)
      dispatch(State.Idle())
    },
    [/* remove */, dispatch]
  )
}

export function FileExplorer() {
  const tree = useWorkspaceTree()
  return (
    <aside className="min-h-full w-full overflow-auto">
      <FileTree tree={tree} />
    </aside>
  )
}
