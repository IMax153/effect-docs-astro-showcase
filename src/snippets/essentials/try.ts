import { Effect } from "effect"

const parse = (input: string) =>
  // This might throw an error if input is not valid JSON
  Effect.try(() => JSON.parse(input))

const program = parse("")
