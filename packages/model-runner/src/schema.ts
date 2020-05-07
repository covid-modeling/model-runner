import * as jsonSchema from 'jsen'
import { RequestInput, output } from '@covid-modeling/api'
import * as fs from 'fs'

// Load the RequestInput JSON schema, which is generated based on the type declaration
// as part of the build step.
const validateRunnerInputSchema = jsonSchema(
  require('@covid-modeling/api/schema/runner.json')
)

// Load the ModelOutput JSON schema, which is generated based on the type declaration
// as part of the build step.
const validateOutputSchema = jsonSchema(
  require('@covid-modeling/api/schema/output.json')
)

export function enforceRunnerInputSchema(input: RequestInput) {
  if (!validateRunnerInputSchema(input)) {
    throw new Error(
      `Invalid model runner input JSON. Details: ${JSON.stringify(
        validateRunnerInputSchema.errors
      )}`
    )
  }
}

export function enforceOutputSchema(outputFilePath: string) {
  const outputData = fs.readFileSync(outputFilePath, 'utf8')
  const output = JSON.parse(outputData) as output.ModelOutput

  if (!validateOutputSchema(output)) {
    throw new Error(
      `Invalid model output JSON. Details: ${JSON.stringify(
        validateOutputSchema.errors
      )}`
    )
  }
}
