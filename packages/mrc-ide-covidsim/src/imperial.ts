import * as path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'
import { output, input } from '@covid-modeling/api'
import { convertOutput } from './convert-output'
import * as params from './imperial-params'
import { logger } from './logger'
import { RunnerModelInput, Model } from './model'
import { COUNTRY_PARAMS_BY_ISO_CODE, US_SUBREGIONS } from './admin-mappings'

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

  /** Gets the path to the administrative units parameter file for the given region. */
  private getAdminPath(region: string): string {
    if (region === 'US') {
      return path.join(this.dataDir, 'admin_units', 'United_States_admin.txt')
    } else if (COUNTRY_PARAMS_BY_ISO_CODE[region]) {
      const { adminFileName } = COUNTRY_PARAMS_BY_ISO_CODE[region]
      return path.join(this.dataDir, 'admin_units', adminFileName)
    } else {
      throw new Error(`Could not find admin file for region ${region}`)
    }
  }

  /**
   * Gets the path to the population density parameter file for the given region.
   * Europe is used as the default.
   */
  private getPopulationDensityPath(region: string, subregion?: string): string {
    let populationDensityFileName: string
    if (
      ['AS', 'GU', 'PR', 'VI'].includes(region) ||
      (region === 'US' &&
        ['US-AK', 'US-HI', 'US-AS', 'US-GU', 'US-PR', 'US-VI'].includes(
          subregion
        ))
    ) {
      populationDensityFileName = 'wpop_us_terr.txt'
    } else if (['US', 'CA'].includes(region)) {
      populationDensityFileName = 'wpop_usacan.txt'
    } else {
      populationDensityFileName = 'wpop_eur.txt'
    }
    return path.join(this.dataDir, 'populations', populationDensityFileName)
  }

  /**
   * Gets the path to the pre-parameters template file for the given region.
   * The UK is used as the default for known regions.
   */
  private getPreParametersTemplatePath(region: string): string {
    let preParamsFileName: string
    if (region === 'US') {
      preParamsFileName = 'preUS_R0=2.0.txt'
    } else if (COUNTRY_PARAMS_BY_ISO_CODE[region]) {
      preParamsFileName =
        COUNTRY_PARAMS_BY_ISO_CODE[region].preParamsFileName ??
        'preUK_R0=2.0.txt'
    } else {
      throw new Error(
        `Could not find pre-parameters template file for region ${region}`
      )
    }
    return path.join(this.dataDir, 'param_files', preParamsFileName)
  }

  private getSubregionName(region: string, subregion: string): string {
    if (region === 'US') {
      return US_SUBREGIONS[subregion]
    } else if (COUNTRY_PARAMS_BY_ISO_CODE[region]) {
      const { subregions } = COUNTRY_PARAMS_BY_ISO_CODE[region]
      return subregions[subregion]
    } else {
      throw new Error(`Could not find subregions for region ${region}`)
    }
  }

  inputs(input: input.ModelInput): ImperialRunnerModelInput {
    const inputFiles = []

    const modelPath = path.join(this.binDir, 'CovidSim')

    // Select the correct static inputs based on the region.
    let adminPath = this.getAdminPath(input.region)
    const populationDensityPath = this.getPopulationDensityPath(
      input.region,
      input.subregion
    )
    const parametersTemplatePath = path.join(
      this.dataDir,
      'param_files',
      'p_NoInt.txt'
    )
    const preParametersTemplatePath = this.getPreParametersTemplatePath(
      input.region
    )
    const subregionName = this.getSubregionName(input.region, input.subregion)

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
      `/S:${this.outputDir}/${input.modelInput.region}-${input.subregionName}-network.bin`,

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
