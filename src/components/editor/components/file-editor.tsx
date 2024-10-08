import { Result, useRxSet, useRxValue } from "@effect-rx/rx-react"
import { useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as Option from "effect/Option"
import { useWorkspaceHandle } from "../context/workspace"
import { editorRx } from "../rx/editor"
import { LoadingOverlay } from "./loading-overlay"

export function FileEditor() {
  const handle = useWorkspaceHandle()
  const { editor, element } = useMemo(() => editorRx(handle), [handle])
  const setElement = useRxSet(element)
  const result = useRxValue(editor)
  const isReady = Result.isSuccess(result)

  const containerRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      setElement(Option.some(node))
    }
  }, [])

  return (
    <section className="h-full flex flex-col">
      <AnimatePresence>
        {!isReady && (
          <motion.div
            className="absolute inset-0 z-10"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingOverlay />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        ref={containerRef}
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: !isReady ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      ></motion.div>
    </section>
  )
}
