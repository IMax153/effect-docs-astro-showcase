import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export function LoadingOverlay() {
  const codeLines = [
    "import * as Effect from \"effect/Effect\"",
    "import * as Console from \"effect/Console\"",
    "",
    "const program = Effect.gen(function* (_) {",
    "  const greeting = yield* _(Effect.succeed(\"Hello\"))",
    "  const name = yield* _(Effect.succeed(\"Effect\"))",
    "  yield* _(Console.log(`${greeting}, ${name}!`))",
    "  return `${greeting}, ${name}!`",
    "})",
    "",
    "const parallel = Effect.all([",
    "  Effect.succeed(1),",
    "  Effect.succeed(2),",
    "  Effect.succeed(3)",
    "])",
    "",
    "const main = Effect.gen(function* (_) {",
    "  const result1 = yield* _(program)",
    "  yield* _(Console.log(`Result 1: ${result1}`))",
    "",
    "  const result2 = yield* _(parallel)",
    "  yield* _(Console.log(`Result 2: ${result2}`))",
    "})",
    "",
    "Effect.runPromise(main)",
    "  .then(() => console.log(\"Program completed successfully\"))",
    "  .catch(console.error)",
  ]

  const [displayText, setDisplayText] = useState("")
  const fullText = "Loading the Effect Playground"

  useEffect(() => {
    let currentIndex = 0
    let isErasing = false
    let pauseCounter = 0

    const intervalId = setInterval(() => {
      if (pauseCounter > 0) {
        pauseCounter--
        return
      }

      if (!isErasing) {
        if (currentIndex < fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          isErasing = true
          pauseCounter = 20 // Pause before erasing
        }
      } else {
        if (currentIndex > 0) {
          setDisplayText(fullText.slice(0, currentIndex - 1))
          currentIndex--
        } else {
          isErasing = false
          pauseCounter = 10 // Pause before retyping
        }
      }
    }, 90)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="fixed inset-0 bg-black text-white font-mono overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-screen overflow-hidden">
          <div className="h-full filter blur-sm">
            <motion.div
              className="h-full"
              initial={{ y: "0%" }}
              animate={{ y: "-50%" }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {codeLines.concat(codeLines).map((line, index) => (
                <motion.div
                  key={index}
                  className="py-1 px-2 text-sm md:text-base lg:text-lg whitespace-pre"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                >
                  {line}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="mb-10 text-2xl md:text-3xl lg:text-4xl font-bold bg-black/80 px-6 py-3 rounded-full text-center">
          {displayText}
          <span className="animate-blink">|</span>
        </div>
      </div>
    </div>
  )
}
