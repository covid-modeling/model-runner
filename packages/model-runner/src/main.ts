import * as pino from 'pino'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import { ModelSlug, RunStatus, RequestInput } from '@covid-modeling/api'
import { BlobStorage } from './blobstore'
import { notifyUI } from './notify-ui'
import { logger } from './logger'
import {
  LOG_DIR,
  OUTPUT_DIR,
  RUNNER_SHARED_SECRET,
  AZURE_STORAGE_ACCOUNT,
  AZURE_STORAGE_CONTAINER,
  INPUT_DIR,
  HOST_WORK_DIR,
} from './config'
import * as Dockerode from 'dockerode'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { createExportZip } from './export'
import * as docker from './docker'
import { enforceInputSchema, enforceOutputSchema } from './schema'

let inputID: string | number | null = null
let callbackURL: string | null = null
let modelSlug: ModelSlug | null = null

const handleRejection: NodeJS.UnhandledRejectionListener = err => {
  const finalLogger = pino.final(logger)
  finalLogger.error(err)
  if (callbackURL && inputID) {
    notifyUI(callbackURL, RUNNER_SHARED_SECRET, inputID, {
      modelSlug,
      status: RunStatus.Failed,
      resultsLocation: '',
      exportLocation: '',
    }).finally(() => {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}

process.on('unhandledRejection', handleRejection)

async function main() {
  try {
    const inputFilename = process.argv[2]
    if (!inputFilename) return usage()

    // Read the request input JSON.
    const inputData = fs.readFileSync(inputFilename, 'utf8')
    const input = JSON.parse(inputData) as RequestInput

    enforceInputSchema(input)

    inputID = input.id
    callbackURL = input.callbackURL
    logger.info(input.configuration)
    modelSlug = input.configuration.model.slug
    const dockerImage = input.configuration.model.imageURL

    // Notify the UI that the simulation is starting.
    if (input.callbackURL) {
      await notifyUI(input.callbackURL, RUNNER_SHARED_SECRET, input.id, {
        modelSlug,
        status: RunStatus.InProgress,
        resultsLocation: '',
        exportLocation: '',
        workflowRunID: process.env.GITHUB_RUN_ID,
      })
    }

    const inputsDir = INPUT_DIR
    const outputsDir = OUTPUT_DIR
    mkdirp.sync(inputsDir)
    mkdirp.sync(outputsDir)
    mkdirp.sync(LOG_DIR)

    logger.info('Preparing model')

    const dockerClient = new Dockerode()

    logger.info('Downloading container: %s', dockerImage)

    await docker.pullImage(dockerClient, dockerImage)

    logger.info(
      'Mounted input: %s',
      `${HOST_WORK_DIR}/${path.basename(INPUT_DIR)}:/data/input:rw`
    )

    logger.info('Starting model run')
    logger.info(JSON.stringify(input))

    logger.info('Running container: %s', dockerImage)
    await docker
      .runContainer(dockerClient, dockerImage)
      .then(data => {
        // TODO: we seem to have lost the reference to the container
        // logger.info('container %d removed', data)
      })
      .catch(err => logger.error(err))

    logger.info('Finished model run')

    logger.info('Creating export zip.')
    const exportZipFile = 'export.zip'
    await createExportZip([INPUT_DIR, OUTPUT_DIR], exportZipFile)

    // Upload results to blob storage.
    const storage = new BlobStorage(
      AZURE_STORAGE_ACCOUNT,
      AZURE_STORAGE_CONTAINER
    )

    const outputFile = path.join(OUTPUT_DIR, 'data.json')

    enforceOutputSchema(outputFile)

    const imageId = await docker.imageHash(dockerClient, dockerImage)
    logger.info('Docker image id: %s', imageId)
    const outputHash = uniqueId(input, imageId)

    logger.info('uploading model results to blob storage.')
    await Promise.all([
      storage.uploadFile(outputFile, outputHash, true),
      storage.uploadFile(exportZipFile, outputHash, true),
      storage.uploadOutputDir(outputHash, LOG_DIR, false),
    ])

    const blobStoreOutputFileKey = storage.modelOutputKey(
      outputHash,
      path.basename(outputFile),
      true
    )

    const blobStoreExportZipKey = storage.modelOutputKey(
      outputHash,
      path.basename(exportZipFile),
      true
    )

    if (input.callbackURL) {
      // FIXME: this is success while we figure out if the model
      // can fail generating results.
      await notifyUI(input.callbackURL, RUNNER_SHARED_SECRET, input.id, {
        modelSlug,
        status: RunStatus.Complete,
        resultsLocation: blobStoreOutputFileKey,
        exportLocation: blobStoreExportZipKey,
      })
    }
  } catch (err) {
    handleRejection(err, Promise.resolve())
  }
}

function uniqueId(runInput: RequestInput, imageId: string): string {
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(runInput))
  hash.update(imageId)
  return hash.digest('base64')
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
