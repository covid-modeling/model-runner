import * as pino from 'pino'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import { readFileSync, writeFileSync } from 'fs'
import * as jsonSchema from 'jsen'
import { RequestInput } from '@covid-modeling/api'
import { logger } from './logger'
import {
  BIN_DIR,
  LOG_DIR,
  MODEL_DATA_DIR,
  OUTPUT_DIR,
  INPUT_DIR,
} from './config'
import { ImperialModel } from './imperial'

// Load the ModelInput JSON schema, which is generated based on the type declaration
// as part of the build step.
const enforceSchema = jsonSchema(
  require('@covid-modeling/api/schema/input.json')
)

let inputID: string | number | null = null
let callbackURL: string | null = null

const handleRejection: NodeJS.UnhandledRejectionListener = err => {
  const finalLogger = pino.final(logger)
  finalLogger.error(err)
  process.exit(1)
}

process.on('unhandledRejection', handleRejection)

async function main() {
  try {
    const inputFilename =
      process.argv[2] ?? path.join(INPUT_DIR, 'inputFile.json')

    // Read the request input JSON.
    const inputData = readFileSync(inputFilename, 'utf8')
    const input = JSON.parse(inputData) as RequestInput
    inputID = input.id
    callbackURL = input.callbackURL
    if (!enforceSchema(input)) {
      throw new Error(
        `Invalid model input JSON. Details: ${JSON.stringify(
          enforceSchema.errors
        )}`
      )
    }

    const inputsDir = INPUT_DIR
    const outputsDir = OUTPUT_DIR
    mkdirp.sync(inputsDir)
    mkdirp.sync(outputsDir)
    mkdirp.sync(LOG_DIR)

    logger.info('Preparing model')
    const model = new ImperialModel(
      8,
      BIN_DIR,
      LOG_DIR,
      MODEL_DATA_DIR,
      inputsDir,
      outputsDir
    )

    const runInput = model.inputs(input.configuration)

    logger.info('Starting model run')
    logger.info(JSON.stringify(runInput))

    // Run the model and write it to the output directory.
    const output = await model.run(runInput)

    const outputPath = path.join(outputsDir, 'data.json')
    writeFileSync(outputPath, JSON.stringify(output))

    logger.info('Finished model run')
  } catch (err) {
    handleRejection(err, Promise.resolve())
  }
}

function usage() {
  console.log(
    `
Usage:

    run-model <input-file>

        Manually perform a single model run with the given input file. Print the output to stdout.

    `.trim()
  )

  process.exit(1)
}

main()
