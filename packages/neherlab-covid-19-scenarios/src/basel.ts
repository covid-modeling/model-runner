import * as path from 'path'
import * as fs from 'fs'
import { input, output } from '@covid-modeling/api'

import { logger } from './logger'
import { DateTime } from 'luxon'
import { RunnerModelInput, Model } from './model'
import {
  BaselModelConnector,
  AlgorithmResult,
  ScenarioData,
  ScenarioArray,
  MitigationInterval,
} from './basel-api'
// https://en.wikipedia.org/wiki/ISO_3166-2
import { REGION_DATA } from './regions'
import { spawn } from 'child_process'

export interface BaselRunnerModelInput extends RunnerModelInput {
  binaryPath: string
}

export class BaselModel implements Model {
  connector: BaselConnector

  constructor(
    private binDir: string,
    private logDir: string,
    private dataDir: string,
    private inputDir: string,
    private outputDir: string
  ) {
    this.connector = new BaselConnector(this.dataDir)
  }

  inputs(modelInput: input.ModelInput): BaselRunnerModelInput {
    const inputFile = path.join(this.inputDir, 'basel-input.json')
    const specificInput = this.connector.translateInputIntoModel(modelInput)
    fs.writeFileSync(inputFile, JSON.stringify(specificInput), {
      encoding: 'utf8',
    })

    logger.info('created model input file: %s', inputFile)

    return {
      modelInput,
      binaryPath: path.join(this.binDir, 'run-basel-model'),
      inputFiles: [inputFile],
    }
  }

  async run(
    baselModelInput: BaselRunnerModelInput
  ): Promise<output.ModelOutput> {
    const outputFile = path.join(this.outputDir, 'basel-output.json')

    // Setup the log file.
    const logFile = path.join(this.logDir, 'basel.log')
    const logFd = fs.openSync(logFile, 'a')

    const args = baselModelInput.inputFiles
    args.push(outputFile)

    // Run the model and wait until it exits.
    const modelProcess = spawn(baselModelInput.binaryPath, args, {
      stdio: ['ignore', logFd, logFd],
    })
    await new Promise((resolve, reject) => {
      modelProcess.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(
            new Error(
              `Model '${baselModelInput.binaryPath}' exited with code ${code}`
            )
          )
        }
      })
    })

    logger.info('Reading model output: %s', outputFile)
    const outputData = fs.readFileSync(outputFile, { encoding: 'utf8' })
    const outputDataJson = JSON.parse(outputData) as AlgorithmResult

    return this.connector.translateOutputFromModel(
      baselModelInput,
      outputDataJson
    )
  }
}

export class BaselConnector implements BaselModelConnector {
  constructor(private dataDir: string) {}

  /** Gets the key that identifies the input region in the Basel model's scenarios.json file. */
  getScenarioRegionKey(region: string, subregion?: string): string {
    // The input region is an ISO-3166 2-digit code.
    const regionData = REGION_DATA[region]
    // Convert the region/subregion into the corresponding key for the Basel scenario data.
    if (subregion) {
      // Subregions have `<ISO-3166-alpha-3 country code>-<subregion name>` as the key.
      logger.info(
        `Basel connector: looking up scenario for region ${region} and subregion ${subregion}`
      )
      const subregionData = regionData.regions[subregion]
      return `${regionData.alpha3}-${subregionData.name}`
    } else {
      logger.info(
        `Basel connector: looking up scenario for entire region ${region}`
      )
      // Entire countries have `<country name>` as the key.
      // The model expects this full name, rather than Great Britain, so we have to special case here.
      return region === 'GB'
        ? 'United Kingdom of Great Britain and Northern Ireland'
        : regionData.name
    }
  }

  translateInputIntoModel(modelInput: input.ModelInput): ScenarioData {
    const scenarioDataPath = path.join(this.dataDir, 'scenarios.json')
    logger.info(`Reading default scenario data from ${scenarioDataPath}`)
    const defaultScenariosContents = fs.readFileSync(scenarioDataPath, 'utf8')
    const defaultScenarios = JSON.parse(
      defaultScenariosContents
    ) as ScenarioArray

    const scenarioRegionKey = this.getScenarioRegionKey(
      modelInput.region,
      modelInput.subregion
    )

    // The scenarios JSON has a top-level key for each supported region or subregion.
    if (!defaultScenarios?.all) {
      throw new Error('Found no default scenario data')
    }
    const scenarioData = defaultScenarios.all.find(
      s => s.name === scenarioRegionKey
    )
    if (scenarioData === undefined) {
      throw new Error(
        `Could not find default scenario for region key ${scenarioRegionKey}`
      )
    }
    const scenario = scenarioData.data

    const { interventionPeriods, r0 } = modelInput.parameters

    // If an r0 is provided, use it.
    // Otherwise use the model's default for the region.
    if (typeof r0 === 'number') {
      scenario.epidemiological.r0 = { begin: r0, end: r0 }
    }

    // Default to the simulation start date from the scenario date,
    // since this is assumed to match the initial number of cases.
    const tMinDefault = DateTime.fromJSDate(
      new Date(scenario.simulation.simulationTimeRange.begin),
      {
        zone: 'utc',
      }
    )
    const firstInterventionDate = DateTime.fromISO(
      modelInput.parameters.interventionPeriods[0].startDate,
      {
        zone: 'utc',
      }
    )
    let tMin = tMinDefault
    if (firstInterventionDate < tMinDefault) {
      // If the first intervention is before the start date,
      // change the start date to be earlier.
      // CORRECTNESS NOTE: This means the initial number of cases may be incorrect,
      // but prevents the model from failing in this case.
      logger.warn(
        `First intervention date of ${firstInterventionDate.toISODate()} is earlier than simulation start date of ${tMinDefault.toISODate()})`
      )
      logger.info(`Using first intervention date as start date instead`)
      tMin = firstInterventionDate
    }
    // HARDCODED CHOICE: End date is 720 days after start date.
    const tMax = tMin.plus({ days: 720 })
    scenario.simulation.simulationTimeRange = {
      begin: tMin.toJSDate(),
      end: tMax.toJSDate(),
    }

    scenario.mitigation.mitigationIntervals = interventionPeriods.map(
      (intervention, i) => {
        const startDate = DateTime.fromISO(intervention.startDate, {
          zone: 'utc',
        })
        const endDate = interventionPeriods[i + 1]
          ? DateTime.fromISO(interventionPeriods[i + 1].startDate, {
              zone: 'utc',
            })
          : tMax
        return {
          color: 'black',
          name: 'Social distancing - general population',
          transmissionReduction: {
            begin: intervention.reductionPopulationContact,
            end: intervention.reductionPopulationContact,
          },
          timeRange: {
            begin: startDate.toJSDate(),
            end: endDate.toJSDate(),
          },
        } as MitigationInterval
      }
    )

    logger.info('Basel connector: transformed input')
    logger.debug(scenarioData)

    return scenarioData
  }

  static getMinMax(ts: number[]): [number, number] {
    return [Math.min(...ts), Math.max(...ts)]
  }

  translateOutputFromModel(
    runInput: BaselRunnerModelInput,
    specificOutput: AlgorithmResult
  ): output.ModelOutput {
    // The model produces trajectories at different percentile ranges.
    // Here we use the middle trajectory.
    // TODO: Consider using the other trajectories as well.
    const middleTrajectory = specificOutput.trajectory.middle
    const t0 = DateTime.fromMillis(middleTrajectory[0].time, {
      zone: 'utc',
    })

    // The model returns Unix timestamps in millis.
    // ModelOutput expects timestamps in days from t0.
    const timestamps = middleTrajectory.map(
      timePoint => DateTime.fromMillis(timePoint.time).diff(t0, 'days').days
    )

    const currentData = middleTrajectory.map(timePoint => timePoint.current)
    const cumulativeData = middleTrajectory.map(
      timePoint => timePoint.cumulative
    )

    const zeroes = currentData.map(_ => 0)
    // `critical` = critical cases in ICU, `overflow` = critical cases outside ICU
    const currentCritical = currentData.map(
      data => data.critical.total + data.overflow.total
    )
    const currentMild = currentData.map(
      data => data.exposed.total + data.infectious.total
    )
    const currentSevere = currentData.map(data => data.severe.total)
    const cumSevere = cumulativeData.map(data => data.hospitalized.total)
    const cumCritical = cumulativeData.map(data => data.critical.total)
    const cumDeaths = cumulativeData.map(data => data.fatality.total)
    const cumRecovered = cumulativeData.map(data => data.recovered.total)
    // Neher Lab consider mild cases as those that recover without hospitalization.
    // Total mild = total recovered - total hospitalized.
    const cumMild = cumRecovered.map((v, i) => v - cumSevere[i])

    logger.debug('Basel connector: cumulative deaths')
    logger.debug(cumDeaths)
    // The model reports cumulative deaths but not incidence of deaths,
    // so read the cumulative data and convert back to pointwise.
    const incDeath = cumulativeToPointwise(cumDeaths)

    // One region at a time.
    const severityMetrics: output.SeverityMetrics = {
      Mild: currentMild,
      // Model does not supply ILI, so use zero.
      ILI: zeroes,
      SARI: currentSevere,
      Critical: currentCritical,
      // Model does not supply CritRecov, but the UI reads it together with SARI.
      // These cases are recorded under SARI, so supply zero here.
      CritRecov: zeroes,
      incDeath,
      cumMild,
      // Model does not supply ILI, so use zero.
      cumILI: zeroes,
      cumSARI: cumSevere,
      cumCritical,
      cumCritRecov: zeroes,
    }
    // severityMetrics['cumDeaths'] = cumDeaths
    const outputRegion = {
      metrics: severityMetrics,
    }
    const modelOutput: output.ModelOutput = {
      metadata: runInput.modelInput,
      time: {
        t0: t0.toISODate(),
        timestamps,
        extent: BaselConnector.getMinMax(timestamps),
      },
      aggregate: outputRegion,
    }
    logger.info('Basel connector: transformed output')
    logger.debug(JSON.stringify(modelOutput))
    return modelOutput
  }
}

/** Returns an array `values` such that `cumulativeValues[i] = sum(values[0..i])`. */
function cumulativeToPointwise(cumulativeValues: number[]): number[] {
  if (cumulativeValues.length === 0) {
    return []
  }
  const values = [cumulativeValues[0]]
  for (let i = 1; i < cumulativeValues.length; i++) {
    values[i] = cumulativeValues[i] - cumulativeValues[i - 1]
  }
  return values
}
