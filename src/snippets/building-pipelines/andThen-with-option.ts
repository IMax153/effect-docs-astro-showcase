import { pipe, Effect, Option } from "effect"

// Simulated asynchronous task fetching a number from a database
const fetchNumberValue = Effect.promise(() => Promise.resolve(42))

// Although one might expect the type to be
// Effect<Option<number>, never, never>, it is actually
// Effect<number, NoSuchElementException, never>
const program = pipe(
  fetchNumberValue,
  Effect.andThen((x) => (x > 0 ? Option.some(x) : Option.none()))
)
