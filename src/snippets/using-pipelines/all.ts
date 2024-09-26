import { Effect } from "effect"

// Simulated function to read configuration from a file
const webConfig = Effect.promise(() =>
  Promise.resolve({ dbConnection: "localhost", port: 8080 })
)

// Simulated function to test database connectivity
const checkDatabaseConnectivity = Effect.promise(() =>
  Promise.resolve("Connected to Database")
)

// Combine both effects to perform startup checks
const startupChecks = Effect.all([webConfig, checkDatabaseConnectivity])

Effect.runPromise(startupChecks).then(([config, dbStatus]) => {
  console.log(
    `Configuration: ${JSON.stringify(config)}, DB Status: ${dbStatus}`
  )
})
/*
Output:
Configuration: {"dbConnection":"localhost","port":8080}, DB Status: Connected to Database
*/
