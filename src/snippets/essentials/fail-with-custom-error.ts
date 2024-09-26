import { Effect } from "effect"

class NetworkError {
  readonly _tag = "NetworkError"
}

const failure = Effect.fail(new NetworkError())
