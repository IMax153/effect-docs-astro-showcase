import { Effect, Console } from "effect"

interface Config {
  host: string
  port: number
  apiKey: string
}

// Create a configuration object with sample values
const makeConfig = (name: string): Config => ({
  host: `${name}.example.com`,
  port: 8080,
  apiKey: "12345-abcde"
})

// Simulate retrieving configuration from a remote node
const remoteConfig = (name: string): Effect.Effect<Config, Error> =>
  Effect.gen(function* () {
    // Simulate node3 being the only one with available config
    if (name === "node3") {
      yield* Console.log(`Config for ${name} found`)
      return makeConfig(name)
    } else {
      yield* Console.log(`Unavailable config for ${name}`)
      return yield* Effect.fail(new Error(`Config not found for ${name}`))
    }
  })

// Define the master configuration and potential fallback nodes
const masterConfig = remoteConfig("master")
const nodeConfigs = ["node1", "node2", "node3", "node4"].map(remoteConfig)

// Attempt to find a working configuration,
// starting with the master and then falling back to other nodes
const config = Effect.firstSuccessOf([masterConfig, ...nodeConfigs])

// Run the effect to retrieve the configuration
const result = Effect.runSync(config)

console.log(result)
/*
Output:
Unavailable config for master
Unavailable config for node1
Unavailable config for node2
Config for node3 found
{ host: 'node3.example.com', port: 8080, apiKey: '12345-abcde' }
*/
