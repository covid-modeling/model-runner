import * as jsonSchema from 'jsen'
import { RequestInput } from '@covid-modeling/api'
import * as fs from 'fs'
import { ModelOutput } from '@covid-modeling/api/dist/src/model-output'

// Load the RequestInput JSON schema, which is generated based on the type declaration
// as part of the build step.
const validateInputSchema = jsonSchema(
  require('@covid-modeling/api/schema/input.json')
)

// Load the ModelOutput JSON schema, which is generated based on the type declaration
// as part of the build step.
const validateOutputSchema = jsonSchema(
  require('@covid-modeling/api/schema/output.json')
)

export function enforceInputSchema(input: RequestInput) {
  if (!validateInputSchema(input)) {
    throw new Error(
      `Invalid model input JSON. Details: ${JSON.stringify(
        validateInputSchema.errors
      )}`
    )
  }
}

export function enforceOutputSchema(outputFilePath: string) {
  const outputData = fs.readFileSync(outputFilePath, 'utf8')
  const output = JSON.parse(outputData) as ModelOutput

  if (!validateOutputSchema(output)) {
    throw new Error(
      `Invalid model output JSON. Details: ${JSON.stringify(
        validateOutputSchema.errors
      )}`
    )
  }
}
