import { Effect, Console } from "effect"

const tuple = [
  Effect.succeed(42).pipe(Effect.tap(Console.log)),
  Effect.succeed("Hello").pipe(Effect.tap(Console.log))
] as const

const combinedEffect = Effect.all(tuple)

Effect.runPromise(combinedEffect).then(console.log)
/*
Output:
42
Hello
[ 42, 'Hello' ]
*/
