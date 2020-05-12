import * as input from './model-input'
import * as output from './model-output'

export { input, output }

export interface RequestInput {
  id: string | number
  models: Model[]
  configuration: input.ModelInput
  callbackURL: string | null
}

export enum RunStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Complete = 'complete',
  Failed = 'failed',
}

export interface RunOutput {
  modelSlug: string
  status: RunStatus
  resultsLocation: string
  exportLocation: string
  workflowRunID?: string
}

export interface Model {
  slug: string
  imageURL: string
}
