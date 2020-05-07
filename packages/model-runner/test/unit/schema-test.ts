import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { RequestInput } from '@covid-modeling/api'
import { enforceRunnerInputSchema, enforceOutputSchema } from '../../src/schema'

suite('schema tests', () => {
  test('enforceInputSchema, on valid input', () => {
    const inputData = fs.readFileSync(
      path.join(path.parse(__dirname).dir, 'test-job-mrc-ide-covidsim.json'),
      'utf8'
    )
    const input = JSON.parse(inputData) as RequestInput
    expect(() => enforceRunnerInputSchema(input)).not.to.throw()
  })

  test('enforceInputSchema, on invalid input', () => {
    const input = JSON.parse('{}') as RequestInput
    expect(() => enforceRunnerInputSchema(input)).to.throw(
      Error,
      'Invalid model runner input JSON. Details:'
    )
  })

  test('enforceOutputSchema, on valid output', () => {
    expect(() =>
      enforceOutputSchema(path.join(__dirname, 'valid-output.json'))
    ).not.to.throw()
  })

  test('enforceOutputSchema, on invalid output', () => {
    expect(() =>
      enforceOutputSchema(path.join(__dirname, 'bad-output-schema.json'))
    ).to.throw(Error, 'Invalid model output JSON. Details:')
  })
})
