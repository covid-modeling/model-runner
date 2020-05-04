import * as path from 'path'

// The path to a directory where log files should be written.
export const LOG_DIR =
  process.env.MODEL_RUNNER_LOG_DIR || path.join(process.cwd(), 'log')

// The path to a directory containing run-specific model input data files.
export const INPUT_DIR =
  process.env.MODEL_INPUT_DIR || path.join(process.cwd(), 'input')

// The path to a directory where output data files should be written.
export const OUTPUT_DIR =
  process.env.MODEL_OUTPUT_DIR || path.join(process.cwd(), 'output')

export const HOST_WORK_DIR = process.env.HOST_WORK_DIR || process.cwd()

// A shared secret used for auth when notifying the web application of progress.
export const RUNNER_SHARED_SECRET = process.env.API_SHARED_SECRET

// The storage account to upload results to
export const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT

// The storage container to upload results to
export const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER

// The Docker Registry user
export const DOCKER_USER = process.env.DOCKER_USER

// The Docker Registry password
export const DOCKER_PASSWORD = process.env.DOCKER_PASSWORD
