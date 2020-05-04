import * as temp from 'temp'
import * as fs from 'fs'
import { assert } from 'chai'
import { ImperialModel } from '../../src/imperial'
import { BIN_DIR, MODEL_DATA_DIR } from '../../src/config'
import { input, ModelSlug } from '@covid-modeling/api'

suite('imperial integration', () => {
  test('run imperial model for Wyoming', async () => {
    const logDir = temp.mkdirSync()
    const inputDir = temp.mkdirSync()
    const outputDir = temp.mkdirSync()

    const model = new ImperialModel(
      4,
      BIN_DIR,
      logDir,
      MODEL_DATA_DIR,
      inputDir,
      outputDir
    )

    const modelInput: input.ModelInput = {
      model: {
        slug: ModelSlug.MRCIDECovidSim,
        imageURL: '',
      },
      region: 'US',
      subregion: 'US-WY',
      parameters: {
        calibrationDate: '2020-04-05',
        calibrationDeathCount: 50,
        calibrationCaseCount: 150,
        r0: null,
        interventionPeriods: [
          {
            startDate: '2020-03-15',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Moderate,
          },
          {
            startDate: '2020-03-21',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Moderate,
            schoolClosure: input.Intensity.Aggressive,
          },
          {
            startDate: '2020-03-25',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Aggressive,
            schoolClosure: input.Intensity.Aggressive,
          },
          {
            startDate: '2020-05-01',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Moderate,
            schoolClosure: input.Intensity.Mild,
          },
          {
            startDate: '2020-06-01',
            reductionPopulationContact: 9,
          },
        ],
      },
    }

    const runInput = model.inputs(modelInput)
    const output = await model.run(runInput)

    // Time info
    const timestepCount = output.time.timestamps.length
    assert.equal(output.time.t0, '2020-01-01')
    for (let i = 1; i < timestepCount; i++) {
      assert.equal(
        output.time.timestamps[i],
        output.time.timestamps[i - 1] + 1,
        'Expected timestamps to be sequential'
      )
    }

    // Metrics names
    checkMetrics(output.aggregate.metrics, timestepCount)

    // Input params are saved
    const inputFilenames = fs.readdirSync(inputDir)
    assert.include(inputFilenames, 'admin-params.txt')
    assert.include(inputFilenames, 'input-params.txt')
  }).timeout(80000)

  test('run imperial model for Wyoming with no interventions', async () => {
    const logDir = temp.mkdirSync()
    const inputDir = temp.mkdirSync()
    const outputDir = temp.mkdirSync()

    const model = new ImperialModel(
      4,
      BIN_DIR,
      logDir,
      MODEL_DATA_DIR,
      inputDir,
      outputDir
    )

    const modelInput: input.ModelInput = {
      model: {
        slug: ModelSlug.MRCIDECovidSim,
        imageURL: '',
      },
      region: 'US',
      subregion: 'US-WY',
      parameters: {
        calibrationDate: '2020-04-05',
        calibrationDeathCount: 50,
        calibrationCaseCount: 150,
        r0: null,
        interventionPeriods: [],
      },
    }

    const runInput = model.inputs(modelInput)
    const output = await model.run(runInput)

    // Time info
    const timestepCount = output.time.timestamps.length
    assert.equal(output.time.t0, '2020-01-01')
    for (let i = 1; i < timestepCount; i++) {
      assert.equal(
        output.time.timestamps[i],
        output.time.timestamps[i - 1] + 1,
        'Expected timestamps to be sequential'
      )
    }

    checkMetrics(output.aggregate.metrics, timestepCount)

    // Input params are saved
    const inputFilenames = fs.readdirSync(inputDir)
    assert.include(inputFilenames, 'admin-params.txt')
    assert.include(inputFilenames, 'input-params.txt')
  }).timeout(80000)

  test('run imperial model for Luxembourg', async () => {
    const logDir = temp.mkdirSync()
    const inputDir = temp.mkdirSync()
    const outputDir = temp.mkdirSync()

    const model = new ImperialModel(
      4,
      BIN_DIR,
      logDir,
      MODEL_DATA_DIR,
      inputDir,
      outputDir
    )

    const modelInput: input.ModelInput = {
      model: {
        slug: ModelSlug.MRCIDECovidSim,
        imageURL: '',
      },
      region: 'LU',
      subregion: '',
      parameters: {
        calibrationDate: '2020-04-05',
        calibrationDeathCount: 50,
        calibrationCaseCount: 150,
        r0: null,
        interventionPeriods: [
          {
            startDate: '2020-03-15',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Moderate,
          },
          {
            startDate: '2020-03-21',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Moderate,
            schoolClosure: input.Intensity.Aggressive,
          },
          {
            startDate: '2020-03-25',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Aggressive,
            schoolClosure: input.Intensity.Aggressive,
          },
          {
            startDate: '2020-05-01',
            reductionPopulationContact: 9,
            socialDistancing: input.Intensity.Moderate,
            schoolClosure: input.Intensity.Mild,
          },
          {
            startDate: '2020-06-01',
            reductionPopulationContact: 9,
          },
        ],
      },
    }

    const runInput = model.inputs(modelInput)
    const output = await model.run(runInput)

    // Time info
    const timestepCount = output.time.timestamps.length
    assert.equal(output.time.t0, '2020-01-01')
    for (let i = 1; i < timestepCount; i++) {
      assert.equal(
        output.time.timestamps[i],
        output.time.timestamps[i - 1] + 1,
        'Expected timestamps to be sequential'
      )
    }

    // Metrics names
    checkMetrics(output.aggregate.metrics, timestepCount)

    // Input params are saved
    const inputFilenames = fs.readdirSync(inputDir)
    assert.include(inputFilenames, 'Luxembourg_admin.txt')
    assert.include(inputFilenames, 'input-params.txt')
  }).timeout(80000)
})

function checkMetrics(metrics, timestepCount) {
  // Metrics names
  assert.deepEqual(Object.keys(metrics).sort(), [
    'CritRecov',
    'Critical',
    'ILI',
    'Mild',
    'SARI',
    'cumCritRecov',
    'cumCritical',
    'cumILI',
    'cumMild',
    'cumSARI',
    'incDeath',
  ])

  // Cumulative metrics increase over time
  for (const metricName in metrics) {
    if (!metrics.hasOwnProperty(metricName)) continue

    const values = metrics[metricName]
    assert.equal(values.length, timestepCount)

    for (const value of values) {
      assert.typeOf(
        value,
        'number',
        `Metric ${metricName} has a non-numeric value ${value}`
      )
    }

    if (metricName.startsWith('cum')) {
      for (let i = 1; i < timestepCount; i++) {
        assert.isAtLeast(
          values[i],
          values[i - 1],
          `Cumulative metric ${metricName} unexpectedly decreased at time ${i}`
        )
      }
    }
  }
}
