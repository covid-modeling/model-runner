import * as path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'
import { output, input } from '@covid-modeling/api'
import { convertOutput } from './convert-output'
import * as params from './imperial-params'
import * as paramsSerializer from './params-serialization'
import { logger } from './logger'
import { RunnerModelInput, Model } from './model'
import { COUNTRY_PARAMS_BY_ISO_CODE } from './mappings'

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
  private getAdminPath(region: string, subregion?: string): string {
    if (COUNTRY_PARAMS_BY_ISO_CODE[region]) {
      const adminFileName =
        COUNTRY_PARAMS_BY_ISO_CODE[region].subregions[subregion]
          ?.adminFileName ?? COUNTRY_PARAMS_BY_ISO_CODE[region].adminFileName
      return path.join(this.dataDir, 'admin_units', adminFileName)
    } else {
      throw new Error(`Could not find admin file for region ${region}`)
    }
  }

  /**
   * Gets the path to the population density parameter file for the given region.
   */
  private getPopulationDensityPath(region: string, subregion?: string): string {
    const populationDensityFileName =
      COUNTRY_PARAMS_BY_ISO_CODE[region]?.subregions[subregion]
        ?.populationDensityFileName ??
      COUNTRY_PARAMS_BY_ISO_CODE[region]?.populationDensityFileName
    return path.join(this.dataDir, 'populations', populationDensityFileName)
  }

  /**
   * Gets the path to the pre-parameters template file for the given region.
   */
  private getPreParametersTemplatePath(region: string): string {
    if (COUNTRY_PARAMS_BY_ISO_CODE[region]) {
      return path.join(
        this.dataDir,
        'param_files',
        COUNTRY_PARAMS_BY_ISO_CODE[region].preParamsFileName
      )
    } else {
      throw new Error(
        `Could not find pre-parameters template file for region ${region}`
      )
    }
  }

  private getSubregionName(region: string, subregion: string): string {
    if (COUNTRY_PARAMS_BY_ISO_CODE[region]) {
      return COUNTRY_PARAMS_BY_ISO_CODE[region]?.subregions[subregion]?.name
    } else {
      throw new Error(`Could not find subregions for region ${region}`)
    }
  }

  inputs(modelInput: input.ModelInput): ImperialRunnerModelInput {
    const inputFiles = []

    const modelPath = path.join(this.binDir, 'CovidSim')

    // Select the correct static inputs based on the region.
    let adminPath = this.getAdminPath(modelInput.region, modelInput.subregion)
    const populationDensityPath = this.getPopulationDensityPath(
      modelInput.region,
      modelInput.subregion
    )
    const parametersTemplatePath = path.join(
      this.dataDir,
      'param_files',
      'p_NoInt.txt'
    )
    const preParametersTemplatePath = this.getPreParametersTemplatePath(
      modelInput.region
    )
    const subregionName = this.getSubregionName(
      modelInput.region,
      modelInput.subregion
    )

    // Generate the intervention-related pre-parameters based on the input.
    inputFiles.push(preParametersTemplatePath)
    const preParametersPath = path.join(this.inputDir, 'pre-params.txt')
    const preParametersTemplate = fs.readFileSync(
      preParametersTemplatePath,
      'utf8'
    )
    const preParameters = paramsSerializer.parse(preParametersTemplate)
    params.assignPreParameters(preParameters, modelInput.parameters)
    const preParametersContent = paramsSerializer.serialize(preParameters)
    fs.writeFileSync(preParametersPath, preParametersContent, 'utf8')

    // Generate the intervention-related parameters based on the input.
    inputFiles.push(parametersTemplatePath)
    const parametersPath = path.join(this.inputDir, 'input-params.txt')
    const parametersTemplate = fs.readFileSync(parametersTemplatePath, 'utf8')
    const parameters = paramsSerializer.parse(parametersTemplate)
    params.assignParameters(parameters, modelInput.parameters)
    const parametersContent = paramsSerializer.serialize(parameters)
    fs.writeFileSync(parametersPath, parametersContent, 'utf8')

    // We only want to modify the admin file for subregions that don't have their own admin file.
    if (
      subregionName &&
      COUNTRY_PARAMS_BY_ISO_CODE[modelInput.region]?.subregions[
        modelInput.subregion
      ]?.adminFileName === undefined
    ) {
      inputFiles.push(adminPath)
      const editedAdminFile = path.join(this.inputDir, 'admin-params.txt')
      const adminText = fs.readFileSync(adminPath, 'utf8')
      const adminParameters = paramsSerializer.parse(adminText)
      params.assignAdminParameters(adminParameters, subregionName)
      const adminContent = paramsSerializer.serialize(adminParameters)
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
      modelInput,
      binaryPath: modelPath,
      adminFilePath: adminPath,
      populationDensityFilePath: populationDensityPath,
      preParametersFilePath: preParametersPath,
      parametersFilePath: parametersPath,
      subregionName,
      inputFiles,
    }
  }

  async run(
    imperialModelInput: ImperialRunnerModelInput
  ): Promise<output.ModelOutput> {
    const r0 = imperialModelInput.modelInput.parameters.r0 ?? 3.0

    const args = [
      `/c:${this.threadCount}`,
      `/A:${imperialModelInput.adminFilePath}`,
      `/D:${imperialModelInput.populationDensityFilePath}`,
      `/PP:${imperialModelInput.preParametersFilePath}`,
      `/P:${imperialModelInput.parametersFilePath}`,
      `/O:${this.outputDir}/result`,
      `/R:${r0 / 2.0}`,
      `/S:${this.outputDir}/${imperialModelInput.modelInput.region}-${imperialModelInput.subregionName}-network.bin`,

      // TODO - cache the intermediate network files
      // '/S:NetworkUKN_32T_100th.bin',

      ...SEEDS,
    ]

    logger.info(args, 'CovidSim args')

    // Setup the log file.
    const logFile = path.join(this.logDir, 'covid-sim.log')
    const logFd = fs.openSync(logFile, 'a')

    // Run the model and wait until it exits.
    const modelProcess = spawn(imperialModelInput.binaryPath, args, {
      stdio: ['ignore', logFd, logFd],
    })
    await new Promise((resolve, reject) => {
      modelProcess.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(
            new Error(
              `Model '${imperialModelInput.binaryPath}' exited with code ${code}`
            )
          )
        }
      })
    })

    // Copy input files for storage
    fs.copyFileSync(
      imperialModelInput.populationDensityFilePath,
      path.join(
        this.inputDir,
        path.basename(imperialModelInput.populationDensityFilePath)
      )
    )

    const tsv = fs.readFileSync(
      path.join(this.outputDir, 'result.avNE.severity.xls'),
      'utf8'
    )

    return convertOutput(imperialModelInput.modelInput, tsv)
  }
}
