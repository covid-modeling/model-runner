import * as path from 'path'
import * as fs from 'fs'
import { input } from '@covid-modeling/api'
import { output } from '@covid-modeling/api'

import { logger } from './logger'
import { DateTime } from 'luxon'
import { RunnerModelInput, Model } from './model'
import { BaselModelConnector, AlgorithmResult, Scenario } from './basel-api'
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

  inputs(input: input.ModelInput): BaselRunnerModelInput {
    const inputFile = path.join(this.inputDir, 'basel-input.json')
    const specificInput = this.connector.translateInputIntoModel(input)
    fs.writeFileSync(inputFile, JSON.stringify(specificInput), {
      encoding: 'utf8',
    })

    logger.info('created model input file: %s', inputFile)

    return {
      modelInput: input,
      binaryPath: path.join(this.binDir, 'run-basel-model'),
      inputFiles: [inputFile],
    }
  }

  async run(input: BaselRunnerModelInput): Promise<output.ModelOutput> {
    const outputFile = path.join(this.outputDir, 'basel-output.json')

    // Setup the log file.
    const logFile = path.join(this.logDir, 'basel.log')
    const logFd = fs.openSync(logFile, 'a')

    const args = input.inputFiles
    args.push(outputFile)

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

    logger.info('Reading model output: %s', outputFile)
    const outputData = fs.readFileSync(outputFile, { encoding: 'utf8' })
    const outputDataJson = JSON.parse(outputData) as AlgorithmResult

    return this.connector.translateOutputFromModel(input, outputDataJson)
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

  translateInputIntoModel(input: input.ModelInput): Scenario {
    const defaultScenariosContents = fs.readFileSync(
      path.join(this.dataDir, 'scenarios.json'),
      'utf8'
    )
    const defaultScenarios = JSON.parse(defaultScenariosContents) as Scenario[]

    const scenarioRegionKey = this.getScenarioRegionKey(
      input.region,
      input.subregion
    )

    // The key is called `country` in the scenario JSON,
    // even when identifying a subregion.
    const scenario = defaultScenarios.find(s => s.country === scenarioRegionKey)
    if (scenario === undefined) {
      throw new Error(
        `Could not find default scenario for region key ${scenarioRegionKey}`
      )
    }

    const { interventionPeriods, r0 } = input.parameters

    // If an r0 is provided, use it.
    // Otherwise use the model's default for the region.
    if (typeof r0 === 'number') {
      scenario.allParams.epidemiological.r0 = r0
    }

    // Default to the simulation start date from the scenario date,
    // since this is assumed to match the initial number of cases.
    const tMinDefault = DateTime.fromJSDate(
      new Date(scenario.allParams.simulation.simulationTimeRange.tMin),
      {
        zone: 'utc',
      }
    )
    const firstInterventionDate = DateTime.fromISO(
      input.parameters.interventionPeriods[0].startDate,
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
    scenario.allParams.simulation.simulationTimeRange = {
      tMin: tMin.toJSDate(),
      tMax: tMax.toJSDate(),
    }

    scenario.allParams.containment.mitigationIntervals = interventionPeriods.map(
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
          id: 'basel-model-social-distancing-general-population',
          name: 'Social distancing - general population',
          mitigationValue: intervention.reductionPopulationContact,
          timeRange: {
            tMin: startDate.toJSDate(),
            tMax: endDate.toJSDate(),
          },
        }
      }
    )

    logger.info('Basel connector: transformed input')
    logger.debug(scenario)

    return scenario
  }

  static getMinMax(ts: number[]): [number, number] {
    return [Math.min(...ts), Math.max(...ts)]
  }

  translateOutputFromModel(
    runInput: BaselRunnerModelInput,
    specificOutput: AlgorithmResult
  ): output.ModelOutput {
    const t0 = DateTime.fromMillis(
      specificOutput.deterministic.trajectory[0].time,
      {
        zone: 'utc',
      }
    )
    const deterministicTrajectory = specificOutput.deterministic.trajectory
    // TODO: At time of writing, the model does not do a stochastic simulation.
    // If this changes, use data from specificOutput.stochastic too,
    // and verify that it has the same timestamps, or combine the timestamp arrays.

    // The model returns Unix timestamps in millis.
    // ModelOutput expects timestamps in days from t0.
    const timestamps = deterministicTrajectory.map(
      timePoint => DateTime.fromMillis(timePoint.time).diff(t0, 'days').days
    )

    const currentData = deterministicTrajectory.map(
      timePoint => timePoint.current
    )
    const cumulativeData = deterministicTrajectory.map(
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
    const output: output.ModelOutput = {
      metadata: runInput.modelInput,
      time: {
        t0: t0.toISODate(),
        timestamps,
        extent: BaselConnector.getMinMax(timestamps),
      },
      aggregate: outputRegion,
    }
    logger.info('Basel connector: transformed output')
    logger.debug(JSON.stringify(output))
    return output
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
