import { pipe, Effect, Either } from "effect"

// Function to parse an integer from a string that can fail
const parseInteger = (input: string): Either.Either<number, string> =>
  isNaN(parseInt(input))
    ? Either.left("Invalid integer")
    : Either.right(parseInt(input))

// Simulated asynchronous task fetching a string from database
const fetchStringValue = Effect.promise(() => Promise.resolve("42"))

// Although one might expect the type to be
// Effect<Either<number, string>, never, never>, it is actually
// Effect<number, string, never>
const program = pipe(
  fetchStringValue,
  Effect.andThen((str) => parseInteger(str))
)
