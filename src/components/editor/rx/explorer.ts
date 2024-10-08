import { Rx } from "@effect-rx/rx-react"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { makeDirectory, makeFile } from "../domain/workspace"
import { Monaco } from "../services/monaco"
import { WebContainer } from "../services/webcontainer"
import type { Editor } from "./editor"
import type { RxWorkspaceHandle } from "./workspace"

const runtime = Rx.runtime(Monaco.Live)

export const explorerRx = Rx.family((handle: RxWorkspaceHandle) =>
  runtime.rx(Effect.gen(function*() {
    const monaco = yield* Monaco
    const container = yield* WebContainer


    function createFile(
      name: string,
      type: Editor.FileType,
      options: Editor.CreateFileOptions = {}
    ) {
      return Effect.gen(function*() {
        // TODO: Validate the file name
        // Get the parent directory if there is one
        const parent = Option.fromNullable(options.parent)
        // Get the current workspace 
        const workspace = yield* SubscriptionRef.get(handle.workspaceRef)
        // Determine the path to the new file in the workspace
        const newPath = Option.match(parent, {
          onNone: () => name,
          onSome: (parent) => `${Option.getOrThrow(workspace.pathTo(parent))}/${name}`
        })
        // Create the file 
        yield* type === "File"
          ? editor.writeFile(newPath, "", "typescript")
          : container.makeDirectory(newPath)
        // Create a new node to add to the workspace
        const node = type === "File"
          ? makeFile(name, "", true)
          : makeDirectory(name, [], true)
        yield* SubscriptionRef.set(
          handle.workspaceRef,
          Option.match(parent, {
            onNone: () => workspace.append(node),
            onSome: (parent) => workspace.replaceNode(
              parent,
              makeDirectory(parent.name, [...parent.children, node], parent.userManaged)
            )
          })
        )
        return node
      }).pipe(Effect.tapErrorCause(Effect.logError))
    }
  }))
)
