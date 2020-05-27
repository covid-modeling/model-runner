import { output, RequestInput } from '@covid-modeling/api'
import { assert } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import * as pino from 'pino'
import * as unzipper from 'unzipper'
import { logger } from '../logger'
import {
  enforceOutputSchema,
  enforceRunnerInputSchema,
} from '@covid-modeling/model-runner/dist/src/schema'
import { parse } from '@covid-modeling/mrc-ide-covidsim/dist/src/imperial-params'

const RUNNER_INPUT_FILENAME = 'runnerInputFile.json'
const MODEL_INPUT_FILENAME = 'inputFile.json'
const MODEL_OUTPUT_FILENAME = 'data.json'

const handleRejection: NodeJS.UnhandledRejectionListener = err => {
  const finalLogger = pino.final(logger)
  finalLogger.error(err)
  process.exit(1)
}

process.on('unhandledRejection', handleRejection)

function getUnzippedResultsPath(tmpDir: string, i: number) {
  return path.join(tmpDir, i.toString())
}

function getUnzippedInputsPath(tmpDir: string, i: number) {
  return path.join(getUnzippedResultsPath(tmpDir, i), 'input')
}

function getUnzippedOutputsPath(tmpDir: string, i: number) {
  return path.join(getUnzippedResultsPath(tmpDir, i), 'output')
}

async function getRunnerInput(tmpDir: string, i: number) {
  const unzippedInput = getUnzippedInputsPath(tmpDir, i)
  const runnerInputPath = path.join(unzippedInput, RUNNER_INPUT_FILENAME)
  logger.info('Reading runner input %d from %s', i, runnerInputPath)
  const runnerInputData = await fs.promises.readFile(runnerInputPath, 'utf8')
  const runnerInput = JSON.parse(runnerInputData) as RequestInput
  logger.info('Validating runner input %d', i)
  logger.info(runnerInput)
  enforceRunnerInputSchema(runnerInput)
  return runnerInput
}

function compareRunnerInputs(runnerInputs: RequestInput[]) {
  logger.info(
    'Comparing run inputs between runs %d and %d',
    runnerInputs[0].id,
    runnerInputs[1].id
  )
  runnerInputs.forEach(input => assert.equal(input.models.length, 1))
  const models = runnerInputs.map(input => input.models[0])
  assert.equal(models[0].slug, models[1].slug, 'Model slugs do not match')
  // Log the model image versions, but do not fail if they differ.
  // This allows us to compare runs even when the model/connector version has changed.
  logger.info(
    'Model image URLs: %s and %s',
    models[0].imageURL,
    models[1].imageURL
  )
  assert.deepEqual(
    runnerInputs[0].configuration,
    runnerInputs[1].configuration,
    'Model inputs do not match'
  )
}

async function compareInputFiles(tmpDir: string) {
  logger.info('Comparing input files')
  const inputDirs: string[] = []
  const inputFilesLists: string[][] = []
  for (let i = 0; i < 2; i++) {
    const inputDir = getUnzippedInputsPath(tmpDir, i)
    inputDirs.push(inputDir)
    const inputFiles = await fs.promises.readdir(inputDir)
    inputFilesLists.push(inputFiles)
  }
  assert.sameMembers(inputFilesLists[0], inputFilesLists[1])

  // Compare the model-specific input files.
  for (const fileName of inputFilesLists[0]) {
    // same file names in both lists
    if ([RUNNER_INPUT_FILENAME, MODEL_INPUT_FILENAME].includes(fileName)) {
      // Skip these, as we compare the JSON elsewhere.
      continue
    }
    logger.info('Comparing input files named %s', fileName)
    const filePaths = inputDirs.map(dir => path.join(dir, fileName))
    const fileContents = await Promise.all(
      filePaths.map(async filePath =>
        fs.promises.readFile(filePath, { encoding: 'utf8' })
      )
    )
    if (isCovidSimInputFile(fileName)) {
      const parameterObjects = fileContents.map(parse)
      assert.deepEqual(
        parameterObjects[0],
        parameterObjects[1],
        'CovidSim parameter objects differ between runs'
      )
    } else {
      assert.equal(
        fileContents[0],
        fileContents[1],
        `Input files named ${fileName} differ between runs`
      )
    }
  }
}

async function getModelOutput(tmpDir: string, i: number) {
  const unzippedOutput = getUnzippedOutputsPath(tmpDir, i)
  const modelOutputPath = path.join(unzippedOutput, MODEL_OUTPUT_FILENAME)
  logger.info('Reading model output %d from %s', i, modelOutputPath)
  enforceOutputSchema(modelOutputPath)
  const modelOutputData = await fs.promises.readFile(modelOutputPath, 'utf8')
  return JSON.parse(modelOutputData) as output.ModelOutput
}

/** Unzips an archive from `zippedPath`, writing its contents to `unzippedPath`. */
async function unzip(zippedPath: string, unzippedPath: string) {
  const readStream = fs.createReadStream(zippedPath)
  const unzipStream = unzipper.Extract({
    path: unzippedPath,
    forceStream: true,
  })
  await new Promise((resolve, reject) => {
    readStream.on('error', reject)
    unzipStream.on('error', reject)
    unzipStream.on('close', resolve)
    readStream.pipe(unzipStream)
  })
}

function compareModelOutputs(modelOutputs: output.ModelOutput[]) {
  logger.info('Comparing run outputs')
  assert.deepEqual(
    modelOutputs[0].metadata,
    modelOutputs[1].metadata,
    'Model output metadata do not match'
  )
  assert.equal(
    modelOutputs[0].time.t0,
    modelOutputs[1].time.t0,
    'Starting timestamps do not match'
  )
  assert.sameOrderedMembers(
    modelOutputs[0].time.extent,
    modelOutputs[1].time.extent,
    'Simulation extents do not match'
  )
  assert.sameOrderedMembers(
    modelOutputs[0].time.timestamps,
    modelOutputs[1].time.timestamps,
    'Simulation timestamps do not match'
  )

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const last = (xs: number[]) => xs[xs.length - 1]
  const totalDeaths = modelOutputs.map(o => sum(o.aggregate.metrics.incDeath))

  const CUMULATIVE_DEATHS_DIFFERENCE_THRESHOLD = 1000
  const CUMULATIVE_CASES_DIFFERENCE_THRESHOLD = 1000
  assert.approximately(
    totalDeaths[1],
    totalDeaths[0],
    CUMULATIVE_DEATHS_DIFFERENCE_THRESHOLD,
    'Total deaths vary'
  )

  const totalCases = modelOutputs
    .map(o => o.aggregate.metrics)
    .map(metrics =>
      [
        metrics.cumMild,
        metrics.cumILI,
        metrics.cumSARI,
        metrics.cumCritical,
      ].map(last)
    )
    .map(sum)
  assert.approximately(
    totalCases[1],
    totalCases[0],
    CUMULATIVE_CASES_DIFFERENCE_THRESHOLD,
    'Total cases vary'
  )

  // TODO compare other metrics
}

suite('comparing runs', async () => {
  let tmpDir: string
  suiteSetup(async () => {
    tmpDir = await fs.promises.mkdtemp(
      path.join(__dirname, 'model-runner-validation')
    )
    logger.info('Working directory: %s', tmpDir)
  })
  suiteTeardown(async () => {
    await fs.promises.rmdir(tmpDir, { recursive: true })
  })

  let inputZips: string[]
  test('process zip files to be compared', async () => {
    const baseResultsZip = process.env.BASE_RESULTS_ZIP
    assert.isDefined(
      baseResultsZip,
      'Set the environment variable BASE_RESULTS_ZIP to the path of a zipped results folder.'
    )
    const comparisonResultsZip = process.env.COMPARISON_RESULTS_ZIP
    assert.isDefined(
      comparisonResultsZip,
      'Set the environment variable COMPARISON_RESULTS_ZIP to the path of a zipped results folder.'
    )
    inputZips = [baseResultsZip, comparisonResultsZip]

    // Unzip the given artifacts.
    for (let i = 0; i < 2; i++) {
      const inputZipPath = await fs.promises.realpath(inputZips[i])
      assert.isTrue(fs.existsSync(inputZipPath))
      const dest = getUnzippedResultsPath(tmpDir, i)
      await fs.promises.mkdir(dest)
      logger.info(`Extracting results zip ${i} from ${inputZipPath} to ${dest}`)
      await unzip(inputZipPath, dest)
      logger.info(`Extracted results zip`)
    }
  }).timeout(10000)

  test('comparing run inputs', async () => {
    logger.info('Reading and validating run inputs')
    const runnerInputs: RequestInput[] = []
    for (let i = 0; i < 2; i++) {
      runnerInputs.push(await getRunnerInput(tmpDir, i))
    }

    compareRunnerInputs(runnerInputs)
    await compareInputFiles(tmpDir)
  })

  test('comparing run outputs', async () => {
    logger.info('Reading and validating run outputs')
    const modelOutputs: output.ModelOutput[] = []
    for (let i = 0; i < 2; i++) {
      modelOutputs.push(await getModelOutput(tmpDir, i))
    }
    compareModelOutputs(modelOutputs)
  })
})

export const isCovidSimInputFile = (fileName: string) =>
  fileName.endsWith('-params.txt')
