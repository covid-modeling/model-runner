import { input, output } from '@covid-modeling/api'
import { RunnerModelInput } from './model'

/**
 * A model connector translates between:
 *
 * - the generalized descriptions of model input and output in our unified model runner API
 *   and
 * - the concrete input and output schema of a specific epidemiological model.
 */
export interface ModelConnector<
  ModelSpecificInputSchema,
  ModelSpecificOutputSchema
> {
  translateInputIntoModel(
    generalInput: input.ModelInput
  ): ModelSpecificInputSchema
  translateOutputFromModel(
    runInput: RunnerModelInput,
    specificOutput: ModelSpecificOutputSchema
  ): output.ModelOutput
}
