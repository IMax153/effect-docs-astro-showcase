import React, { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { useClickOutside } from "@/hooks/useClickOutside"
import { State, useExplorerDispatch } from "../file-explorer"
import { File as FileIcon, Folder } from "lucide-react"
import type { Editor } from "../../rx/editor"

export function FileInput({
  depth,
  type,
  onSubmit,
  initialValue = ""
}: {
  readonly depth: number
  readonly type: Editor.FileType
  readonly initialValue?: string
  readonly onSubmit: (path: string) => void
}) {
  const dispatch = useExplorerDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState(initialValue)

  const paddingLeft = 16 + depth * 8
  const styles = { paddingLeft: `${paddingLeft}px` }

  function getIcon(type: "File" | "Directory") {
    if (type === "File") {
      return <FileIcon size={16} />
    }
    return <Folder size={16} />
  }

  const handleChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >((event) => setFileName(event.target.value), [setFileName])

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault()
      setFileName("")
      onSubmit(fileName)
    },
    [fileName, onSubmit, setFileName]
  )

  // Close the input when the user clicks outside
  useClickOutside(inputRef, () => dispatch(State.Idle()))

  // Close the input when the user hits the escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(State.Idle())
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [dispatch])

  return (
    <div style={styles} className="flex items-center py-1 text-gray-300">
      <span className="flex items-center h-4 w-4 mr-1">
        {getIcon(type)}
      </span>
      <form className="grow mr-1" onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          className="h-6 p-0 text-gray-300 border-solid border-gray-300 rounded-none"
          value={fileName}
          onChange={handleChange}
          autoFocus
        />
      </form>
    </div>
  )
}
