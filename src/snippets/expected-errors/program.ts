import { Effect } from "effect"

class HttpError {
  readonly _tag = "HttpError"
}

const program = Effect.fail(new HttpError())
//    ^? const program: Effect.Effect<never, HttpError, never>
