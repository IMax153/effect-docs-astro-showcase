import { Result, useRxSet, useRxValue } from "@effect-rx/rx-react"
import { useEffect, useMemo, useRef } from "react"
import * as Option from "effect/Option"
import { cn } from "@/lib/css/utils"
import { editorRx } from "../rx/editor"

export function FileEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { editor, element } = useMemo(() => editorRx(), [])
  const setElement = useRxSet(element)
  const result = useRxValue(editor)
  const isReady = Result.isSuccess(result)

  useEffect(() => {
    if (containerRef.current) {
      setElement(Option.some(containerRef.current))
    }
  }, [containerRef, setElement])

  return (
    <section className="h-full flex flex-col">
      {!isReady && <div>Loading...</div>}
      <div ref={containerRef} className={cn("h-full", !isReady && "hidden")} />
    </section>
  )
}
