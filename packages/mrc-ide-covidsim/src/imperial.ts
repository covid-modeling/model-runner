import * as path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'
import { output, input } from '@covid-modeling/api'
import { convertOutput } from './convert-output'
import * as params from './imperial-params'
import { logger } from './logger'
import { RunnerModelInput, Model } from './model'
import {
  EUROPE_COUNTRY_PARAMS_BY_ISO_CODE,
  US_SUBREGIONS,
} from './admin-mappings'

// These are taken from the imperial model's regression test
const SEEDS = ['98798150', '729101', '17389101', '4797132']

export interface ImperialRunnerModelInput extends RunnerModelInput {
  binaryPath: string
  adminFilePath: string
  populationDensityFilePath: string
  preParametersFilePath: string
  parametersFilePath: string
  subregionName?: string
  inputFiles: string[]
}

export class ImperialModel implements Model {
  binDir: string
  logDir: string
  dataDir: string
  inputDir: string
  outputDir: string
  threadCount: number

  constructor(
    threadCount: number,
    binDir: string,
    logDir: string,
    dataDir: string,
    inputDir: string,
    outputDir: string
  ) {
    this.binDir = binDir
    this.logDir = logDir
    this.dataDir = dataDir
    this.inputDir = inputDir
    this.outputDir = outputDir
    this.threadCount = threadCount
  }

  inputs(input: input.ModelInput): ImperialRunnerModelInput {
    const inputFiles = []
    // Select the correct executable and static inputs based on the region.
    let modelPath,
      adminPath,
      populationDensityPath,
      preParametersTemplatePath,
      parametersTemplatePath,
      subregionName

    // The US has its own executable, population density file, and pre-params file.
    if (input.region === 'US') {
      modelPath = path.join(this.binDir, 'CovidSim-US')
      adminPath = path.join(
        this.dataDir,
        'admin_units',
        'United_States_admin.txt'
      )
      populationDensityPath = path.join(
        this.dataDir,
        'populations',
        'wpop_usacan.txt'
      )
      preParametersTemplatePath = path.join(
        this.dataDir,
        'param_files',
        'preUS_R0=2.0.txt'
      )
      parametersTemplatePath = path.join(
        this.dataDir,
        'param_files',
        'p_NoInt.txt'
      )
      subregionName = US_SUBREGIONS[input.subregion]
    }

    // European countries differ only in their admin file.
    else if (EUROPE_COUNTRY_PARAMS_BY_ISO_CODE[input.region]) {
      const { adminFileName, subregions } = EUROPE_COUNTRY_PARAMS_BY_ISO_CODE[
        input.region
      ]

      modelPath = path.join(this.binDir, 'CovidSim-UK')
      adminPath = path.join(this.dataDir, 'admin_units', adminFileName)
      populationDensityPath = path.join(
        this.dataDir,
        'populations',
        'wpop_eur.txt'
      )
      preParametersTemplatePath = path.join(
        this.dataDir,
        'param_files',
        'preUK_R0=2.0.txt'
      )
      parametersTemplatePath = path.join(
        this.dataDir,
        'param_files',
        'p_NoInt.txt'
      )
      subregionName = subregions[input.subregion]
    }

    // Generate the intervention-related pre-parameters based on the input.
    inputFiles.push(preParametersTemplatePath)
    const preParametersPath = path.join(this.inputDir, 'pre-params.txt')
    const preParametersTemplate = fs.readFileSync(
      preParametersTemplatePath,
      'utf8'
    )
    const preParameters = params.parse(preParametersTemplate)
    params.assignPreParameters(preParameters, input.parameters)
    const preParametersContent = params.serialize(preParameters)
    fs.writeFileSync(preParametersPath, preParametersContent, 'utf8')

    // Generate the intervention-related parameters based on the input.
    inputFiles.push(parametersTemplatePath)
    const parametersPath = path.join(this.inputDir, 'input-params.txt')
    const parametersTemplate = fs.readFileSync(parametersTemplatePath, 'utf8')
    const parameters = params.parse(parametersTemplate)
    params.assignParameters(parameters, input.parameters)
    const parametersContent = params.serialize(parameters)
    fs.writeFileSync(parametersPath, parametersContent, 'utf8')

    if (subregionName) {
      inputFiles.push(adminPath)
      const editedAdminFile = path.join(this.inputDir, 'admin-params.txt')
      const adminText = fs.readFileSync(adminPath, 'utf8')
      const adminParameters = params.parse(adminText)
      params.assignAdminParameters(adminParameters, subregionName)
      const adminContent = params.serialize(adminParameters)
      fs.writeFileSync(editedAdminFile, adminContent)
      adminPath = editedAdminFile
    } else {
      const adminFileCopy = path.join(this.inputDir, path.basename(adminPath))
      fs.copyFileSync(adminPath, adminFileCopy)
      adminPath = adminFileCopy
    }

    inputFiles.push(adminPath)
    inputFiles.push(populationDensityPath)
    inputFiles.push(preParametersPath)
    inputFiles.push(parametersPath)

    return {
      modelInput: input,
      binaryPath: modelPath,
      adminFilePath: adminPath,
      populationDensityFilePath: populationDensityPath,
      preParametersFilePath: preParametersPath,
      parametersFilePath: parametersPath,
      subregionName,
      inputFiles,
    }
  }

  async run(input: ImperialRunnerModelInput): Promise<output.ModelOutput> {
    const r0 = input.modelInput.parameters.r0 ?? 3.0

    const args = [
      `/c:${this.threadCount}`,
      `/A:${input.adminFilePath}`,
      `/D:${input.populationDensityFilePath}`,
      `/PP:${input.preParametersFilePath}`,
      `/P:${input.parametersFilePath}`,
      `/O:${this.outputDir}/result`,
      `/R:${r0 / 2.0}`,
      `/S:${this.outputDir}/${input.subregionName}-network.bin`,

      // TODO - cache the intermediate network files
      // '/S:NetworkUKN_32T_100th.bin',

      ...SEEDS,
    ]

    logger.info(args, 'CovidSim args')

    // Setup the log file.
    const logFile = path.join(this.logDir, 'covid-sim.log')
    const logFd = fs.openSync(logFile, 'a')

    // Run the model and wait until it exits.
    const modelProcess = spawn(input.binaryPath, args, {
      stdio: ['ignore', logFd, logFd],
    })
    await new Promise((resolve, reject) => {
      modelProcess.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(
            new Error(`Model '${input.binaryPath}' exited with code ${code}`)
          )
        }
      })
    })

    // Copy input files for storage
    fs.copyFileSync(
      input.populationDensityFilePath,
      path.join(this.inputDir, path.basename(input.populationDensityFilePath))
    )

    const tsv = fs.readFileSync(
      path.join(this.outputDir, 'result.avNE.severity.xls'),
      'utf8'
    )

    return convertOutput(input.modelInput, tsv)
  }
}
