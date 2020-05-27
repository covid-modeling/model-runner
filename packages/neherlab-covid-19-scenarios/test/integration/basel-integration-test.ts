import * as path from 'path'
import * as temp from 'temp'
import * as fs from 'fs'
import { assert } from 'chai'
import { input } from '@covid-modeling/api'
import { BaselModel } from '../../src/basel'
import { BIN_DIR, MODEL_DATA_DIR } from '../../src/config'

suite('basel integration', () => {
  interface TestRegion {
    region: string
    subregion?: string
    t0: string
    r0?: number
  }
  const regions: TestRegion[] = [
    { region: 'US', subregion: undefined, t0: '2020-02-01' },
    { region: 'US', subregion: 'US-NY', t0: '2020-02-13' },
    { region: 'GB', subregion: undefined, t0: '2020-02-09' },
    { region: 'DE', subregion: undefined, t0: '2020-02-06' },
    { region: 'IT', subregion: undefined, t0: '2020-02-02' },
    { region: 'RU', subregion: undefined, t0: '2020-02-20' },
    { region: 'CA', subregion: undefined, t0: '2020-02-09' },
  ]
  const testRegions: TestRegion[] = []
  regions.forEach(r => {
    testRegions.push(r)
    const withR0 = Object.assign({}, r)
    withR0.r0 = 3.0
    testRegions.push(withR0)
  })

  function testCumulativeMetrics(
    incValues: number[],
    cumValues: number[],
    timestepCount: number
  ) {
    const PRECISION = 0.00000001
    assert.equal(incValues[0], 0)
    assert.equal(cumValues[0], 0)
    assert.equal(incValues.length, timestepCount)
    assert.equal(cumValues.length, timestepCount)
    for (let i = 1; i < timestepCount; i++) {
      // The exact values might differ due to floating point precision,
      // so test equality up to a fixed precision.
      assert.approximately(
        cumValues[i],
        cumValues[i - 1] + incValues[i],
        PRECISION
      )
    }
  }

  testRegions.forEach(testRegion => {
    test(`run basel model for region ${testRegion.region}, subregion ${testRegion.subregion}, r0 = ${testRegion.r0}`, async () => {
      const root = temp.mkdirSync()
      const logDir = path.join(root, 'log')
      const inputDir = path.join(root, 'input')
      const outputDir = path.join(root, 'output')

      fs.mkdirSync(logDir)
      fs.mkdirSync(inputDir)
      fs.mkdirSync(outputDir)

      const model = new BaselModel(
        BIN_DIR,
        logDir,
        MODEL_DATA_DIR,
        inputDir,
        outputDir
      )

      const modelInput: input.ModelInput = {
        region: testRegion.region,
        subregion: testRegion.subregion,
        parameters: {
          calibrationCaseCount: 14,
          calibrationDeathCount: 10,
          calibrationDate: '2020-04-08',
          r0: testRegion.r0,
          interventionPeriods: [
            {
              startDate: '2020-04-08',
              reductionPopulationContact: 80,
            },
          ],
        },
      }

      const runInput = model.inputs(modelInput)
      const output = await model.run(runInput)

      assert.deepEqual(output.metadata, modelInput)

      // Time info
      const timestepCount = output.time.timestamps.length
      assert.equal(output.time.t0, testRegion.t0)
      for (let i = 1; i < timestepCount; i++) {
        assert.equal(
          output.time.timestamps[i],
          output.time.timestamps[i - 1] + 1,
          'Expected timestamps to be sequential'
        )
      }

      // Metrics names
      assert.deepEqual(Object.keys(output.aggregate.metrics).sort(), [
        'CritRecov',
        'Critical',
        'ILI',
        'Mild',
        'SARI',
        'cumCritRecov',
        'cumCritical',
        // 'cumDeaths',
        'cumILI',
        'cumMild',
        'cumSARI',
        'incDeath',
      ])

      // Cumulative metrics increase over time
      for (const metricName in output.aggregate.metrics) {
        if (metricName.startsWith('cum')) {
          const values = output.aggregate.metrics[metricName]
          assert.equal(values[0], 0)
          assert.equal(values.length, timestepCount)
          for (let i = 1; i < timestepCount; i++) {
            assert.isAtLeast(
              values[i],
              values[i - 1],
              'Expected cumulative metrics not to decrease'
            )
          }
        }
      }

      // Cumulative metrics are the cumulative sum of incidence metrics
      for (const metricName of [
        'cumMild',
        'cumILI',
        'cumSARI',
        'cumCritical',
        'cumCritRecov',
      ]) {
        for (let i = 1; i < timestepCount; i++) {
          assert.isAtLeast(
            output.aggregate.metrics[metricName][i],
            output.aggregate.metrics[metricName][i - 1],
            `Cumulative metric ${metricName} unexpectedly decreased at time ${i}`
          )
        }
      }

      // testCumulativeMetrics(
      //   output.aggregate.metrics.incDeath,
      //   output.aggregate.metrics['cumDeaths'],
      //   timestepCount
      // )

      // Input params are saved
      const inputFilenames = fs.readdirSync(inputDir)
      assert.include(inputFilenames, 'basel-input.json')
    }).timeout(200000)
  })
})
