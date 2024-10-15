import { useCallback, useMemo } from "react";
import { useRxSet, useRxValue } from "@effect-rx/rx-react";
import * as Option from "effect/Option"
import { useWorkspaceHandle } from "../context/workspace";
import { editorRx } from "../rx/editor"

export function FileEditor() {
  const handle = useWorkspaceHandle()
  const { editor, element } = useMemo(() => editorRx(handle), [])
  const setElement = useRxSet(element)
  useRxValue(editor)

  const containerRef = useCallback((node: HTMLDivElement) => {
    setElement(Option.some(node))
  }, [setElement])

  return (
    <section className="h-full flex flex-col">
      <div ref={containerRef} className="h-full"></div>
    </section>
  )
}

