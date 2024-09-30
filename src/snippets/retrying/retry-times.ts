import { Effect } from "effect"
import { task } from "./simulation"

Effect.runPromise(Effect.retry(task, { times: 5 }))
/*
Output:
failure
failure
failure
success
*/
