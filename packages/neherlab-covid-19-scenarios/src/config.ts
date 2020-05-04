import * as path from 'path'

// The path to a directory containing the model executables.
export const BIN_DIR =
  process.env.MODEL_RUNNER_BIN_DIR || path.join(process.cwd(), '/.local/bin')

// The path to a directory where log files should be written.
export const LOG_DIR =
  process.env.MODEL_RUNNER_LOG_DIR || path.join(process.cwd(), 'log')

// The path to a directory containing static model input data.
export const MODEL_DATA_DIR =
  process.env.MODEL_DATA_DIR || path.join(process.cwd(), 'data')

// The path to a directory containing run-specific model input data files.
export const INPUT_DIR =
  process.env.MODEL_INPUT_DIR || path.join(process.cwd(), 'input')

// The path to a directory where output data files should be written.
export const OUTPUT_DIR =
  process.env.MODEL_OUTPUT_DIR || path.join(process.cwd(), 'output')
