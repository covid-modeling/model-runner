import { assert } from 'chai'
import { input, output } from '@covid-modeling/api'

import {
  AlgorithmResult,
  ScenarioData,
  ScenarioDatum,
  ScenarioArray,
} from '../../src/basel-api'
import { BaselConnector, BaselRunnerModelInput } from '../../src/basel'
import * as path from 'path'
import * as fs from 'fs'

const TEST_SCENARIO_DATUM: ScenarioDatum = {
  mitigation: {
    mitigationIntervals: [],
  },
  epidemiological: {
    infectiousPeriodDays: 3.0,
    latencyDays: 3.0,
    hospitalStayDays: 3.0,
    icuStayDays: 14.0,
    overflowSeverity: 2.0,
    peakMonth: 0,
    r0: { begin: 2.7, end: 2.7 },
    seasonalForcing: 0.0,
  },
  population: {
    icuBeds: 2378,
    caseCountsName: 'country name placeholder for case counts',
    ageDistributionName: 'country name placeholder for age distribution',
    hospitalBeds: 96000,
    importsPerDay: 0.1,
    initialNumberOfCases: 10,
    populationServed: 24600000,
  },
  simulation: {
    numberStochasticRuns: 10,
    simulationTimeRange: {
      begin: new Date('2020-04-01'),
      // Ignored
      end: new Date(),
    },
  },
}

suite('converting to Basel model input', () => {
  let dataDir: string
  setup(() => {
    dataDir = fs.mkdtempSync(path.resolve(__dirname, '..', 'basel-model-test'))
  })
  teardown(() => {
    fs.rmdirSync(dataDir, { recursive: true })
  })

  interface TestRegion {
    region: string
    subregion?: string
    scenarioKey: string
    r0?: number
  }

  const regions: TestRegion[] = [
    {
      region: 'US',
      subregion: undefined,
      scenarioKey: 'United States of America',
    },
    { region: 'US', subregion: 'US-NY', scenarioKey: 'USA-New York' },
    {
      region: 'GB',
      subregion: undefined,
      scenarioKey: 'United Kingdom of Great Britain and Northern Ireland',
    },
    {
      region: 'RU',
      subregion: undefined,
      scenarioKey: 'Russian Federation',
    },
    {
      region: 'CA',
      subregion: undefined,
      scenarioKey: 'Canada',
    },
  ]

  // Update test regions with the two r0 possibilities:
  // either it is left unspecified, or it is explicitly set.
  const testRegions: TestRegion[] = []
  regions.forEach(r => {
    testRegions.push(r)
    const withR0 = Object.assign({}, r)
    withR0.r0 = 3.0
    testRegions.push(withR0)
  })

  regions.forEach(r => {
    const connector = new BaselConnector(dataDir)
    test(`can convert input region ${r.region} and subregion ${r.subregion}`, () => {
      assert.equal(
        connector.getScenarioRegionKey(r.region, r.subregion),
        r.scenarioKey
      )
    })
  })

  testRegions.forEach(r => {
    test(`can convert into model input for region ${r.region}, subregion ${r.subregion}, r0 = ${r.r0}`, () => {
      const parameters: input.ModelParameters = {
        calibrationDate: '2020-04-20',
        calibrationCaseCount: 150,
        calibrationDeathCount: 50,
        r0: r.r0,
        interventionPeriods: [
          {
            startDate: '2020-04-01',
            reductionPopulationContact: 50,
          },
          {
            startDate: '2020-04-08',
            reductionPopulationContact: 90,
          },
          {
            startDate: '2020-07-01',
            reductionPopulationContact: 0,
          },
        ],
      }
      const generalInput: input.ModelInput = {
        region: r.region,
        subregion: r.subregion,
        parameters,
      }
      // Write a default scenario to a file.
      const scenario: ScenarioData = {
        name: r.scenarioKey,
        data: TEST_SCENARIO_DATUM,
      }
      const scenarioArray: ScenarioArray = {
        all: [scenario],
      }
      const scenarioFile = path.join(dataDir, 'scenarios.json')
      fs.writeFileSync(scenarioFile, JSON.stringify(scenarioArray), {
        encoding: 'utf8',
      })

      const connector = new BaselConnector(dataDir)
      const specificInput = connector.translateInputIntoModel(generalInput)

      assert.equal(specificInput.name, r.scenarioKey)
      const expectedR0 = r.r0 ?? 2.7
      assert.equal(specificInput.data.epidemiological.r0.begin, expectedR0)
      assert.equal(
        specificInput.data.population.ageDistributionName,
        'country name placeholder for age distribution'
      )
      assert.equal(specificInput.data.simulation.numberStochasticRuns, 10)
      assert.equal(specificInput.data.epidemiological.r0.end, expectedR0)
      assert.deepEqual(specificInput.data.simulation.simulationTimeRange, {
        begin: new Date('2020-04-01'),
        end: new Date('2022-03-22'),
      })
      assert.deepEqual(specificInput.data.mitigation, {
        mitigationIntervals: [
          {
            color: 'black',
            name: 'Social distancing - general population',
            transmissionReduction: {
              begin: 50,
              end: 50,
            },
            timeRange: {
              begin: new Date('2020-04-01'),
              end: new Date('2020-04-08'),
            },
          },
          {
            color: 'black',
            name: 'Social distancing - general population',
            transmissionReduction: { begin: 90, end: 90 },
            timeRange: {
              begin: new Date('2020-04-08'),
              end: new Date('2020-07-01'),
            },
          },
          {
            color: 'black',
            name: 'Social distancing - general population',
            transmissionReduction: { begin: 0, end: 0 },
            timeRange: {
              begin: new Date('2020-07-01'),
              end: new Date('2022-03-22'),
            },
          },
        ],
      })
    })
  })
})

suite('converting from Basel model output', () => {
  test('can convert from model output with two timestamps', () => {
    const specificOutput: AlgorithmResult = {
      trajectory: {
        // Deliberately blank as these are currently ignored.
        lower: [],
        upper: [],
        percentile: {},
        // Sample data taken from the end of a result sequence.
        middle: [
          {
            time: 1583366400000,
            current: {
              susceptible: {
                '0-9': 269442.0133071396,
                '10-19': 254907.6902363632,
                '20-29': 274855.466874615,
                '30-39': 302776.76641380345,
                '40-49': 269204.9979860594,
                '50-59': 253054.69972935773,
                '60-69': 215879.58940100658,
                '70-79': 150345.19075102932,
                '80+': 85926.90805213586,
                total: 2076393.3227515104,
              },
              severe: {
                '0-9': 0.00002962120915344532,
                '10-19': 0.00013887592507850924,
                '20-29': 0.0002910726896042528,
                '30-39': 0.0008968604781697247,
                '40-49': 0.00339558501128918,
                '50-59': 0.005325368249042541,
                '60-69': 0.03480089310629871,
                '70-79': 0.04031686424538309,
                '80+': 0.09034815312723893,
                total: 0.17554329404125837,
              },
              exposed: {
                '0': 0.04482386215522138,
                '1': 0.04420403660415888,
                '2': 0.04505472236276406,
                '3': 0.046245444131434235,
                '4': 0.04481375448448341,
                '5': 0.04412501463275193,
                '6': 0.04253965815396213,
                '7': 0.03974490159330438,
                '8': 0.03699774251490028,
                total: 0.38854913663298074,
              },
              overflow: {
                '0-9': 0,
                '10-19': 0,
                '20-29': 0,
                '30-39': 0,
                '40-49': 0,
                '50-59': 0,
                '60-69': 0,
                '70-79': 0,
                '80+': 0,
                total: 0,
              },
              critical: {
                '0-9': 0.00003932632538834554,
                '10-19': 0.00039565909994848566,
                '20-29': 0.0008493154341509773,
                '30-39': 0.0037651625748243967,
                '40-49': 0.015768462328218495,
                '50-59': 0.027347978853410476,
                '60-69': 0.2074161661524089,
                '70-79': 0.27577378298865024,
                '80+': 0.6516722690209867,
                total: 1.183028122777987,
              },
              infectious: {
                '0-9': 0.04482386555088196,
                '10-19': 0.0442040399188899,
                '20-29': 0.045054725788567646,
                '30-39': 0.04624544771270829,
                '40-49': 0.04481375787882424,
                '50-59': 0.044125017937165195,
                '60-69': 0.042539661251378154,
                '70-79': 0.03974490432581387,
                '80+': 0.03699774488871799,
                total: 0.38854916525294725,
              },
            },
            cumulative: {
              recovered: {
                '0-9': 2922734.1812616875,
                '10-19': 2764964.4258779096,
                '20-29': 2981189.9119870085,
                '30-39': 3283607.0305856103,
                '40-49': 2917172.552880595,
                '50-59': 2734396.287951349,
                '60-69': 2300956.8607557486,
                '70-79': 1550579.483610116,
                '80+': 827703.3328644233,
                total: 22283304.067774445,
              },
              hospitalized: {
                '0-9': 2922.756897045129,
                '10-19': 8295.294664066687,
                '20-29': 17888.870658095602,
                '30-39': 29559.15126985772,
                '40-49': 70084.46189727413,
                '50-59': 137250.41060103034,
                '60-69': 351262.0988279508,
                '70-79': 456644.6443325662,
                '80+': 466053.5089761889,
                total: 1539961.1981240755,
              },
              critical: {
                '0-9': 2877.3253301643153,
                '10-19': 8027.70370876654,
                '20-29': 17311.808600234195,
                '30-39': 28072.930250472353,
                '40-49': 64057.74288561164,
                '50-59': 116026.56246251847,
                '60-69': 269681.16930009593,
                '70-79': 296056.1520344699,
                '80+': 257246.1388002821,
                total: 1059357.5333726155,
              },
              fatality: {
                '0-9': 22.715714492873268,
                '10-19': 133.79494311504567,
                '20-29': 288.52988854260593,
                '30-39': 743.1058476696137,
                '40-49': 3014.296042600891,
                '50-59': 10612.412199608014,
                '60-69': 40792.89004316287,
                '70-79': 80298.91773631038,
                '80+': 104403.51804900041,
                total: 240310.18046450272,
              },
            },
          },
          {
            time: 1583452800000,
            current: {
              susceptible: {
                '0-9': 269441.9983658529,
                '10-19': 254907.67550168504,
                '20-29': 274855.4518563749,
                '30-39': 302776.75099865615,
                '40-49': 269204.983048142,
                '50-59': 253054.6850210202,
                '60-69': 215879.5752211212,
                '70-79': 150345.17750272938,
                '80+': 85926.89571955551,
                total: 2076393.1932351373,
              },
              severe: {
                '0-9': 0.000029199012081882694,
                '10-19': 0.0001346095473687654,
                '20-29': 0.0002818722105262596,
                '30-39': 0.0008567924765366318,
                '40-49': 0.0032361720408321157,
                '50-59': 0.0050967549723393716,
                '60-69': 0.03319669283108804,
                '70-79': 0.038626380218718524,
                '80+': 0.08667885507941758,
                total: 0.16813732838890916,
              },
              exposed: {
                '0': 0.04482386130641947,
                '1': 0.04420403577558325,
                '2': 0.04505472150642866,
                '3': 0.046245443236242946,
                '4': 0.04481375363601133,
                '5': 0.04412501380675497,
                '6': 0.042539657379698864,
                '7': 0.03974490091024022,
                '8': 0.03699774192148202,
                total: 0.3885491294788617,
              },
              overflow: {
                '0-9': 0,
                '10-19': 0,
                '20-29': 0,
                '30-39': 0,
                '40-49': 0,
                '50-59': 0,
                '60-69': 0,
                '70-79': 0,
                '80+': 0,
                total: 0,
              },
              critical: {
                '0-9': 0.00003708827076560217,
                '10-19': 0.00037278100893960685,
                '20-29': 0.0007999786396873189,
                '30-39': 0.0035478933914572155,
                '40-49': 0.014894664964068128,
                '50-59': 0.025881595051574353,
                '60-69': 0.1969437688969515,
                '70-79': 0.26247441497772783,
                '80+': 0.6224027885321954,
                total: 1.127354973733367,
              },
              infectious: {
                '0-9': 0.04482386470195396,
                '10-19': 0.044204039090194984,
                '20-29': 0.04505472493210363,
                '30-39': 0.04624544681737532,
                '40-49': 0.04481375703022618,
                '50-59': 0.044125017111049804,
                '60-69': 0.04253966047701384,
                '70-79': 0.03974490364267932,
                '80+': 0.036997744295259455,
                total: 0.3885491580978565,
              },
            },
            cumulative: {
              recovered: {
                '0-9': 2922734.196204818,
                '10-19': 2764964.4406315032,
                '20-29': 2981189.927046122,
                '30-39': 3283607.0461797663,
                '40-49': 2917172.568523283,
                '50-59': 2734396.3035944668,
                '60-69': 2300956.881236998,
                '70-79': 1550579.5022387668,
                '80+': 827703.355388663,
                total: 22283304.221044384,
              },
              hospitalized: {
                '0-9': 2922.756911986417,
                '10-19': 8295.294708270727,
                '20-29': 17888.870748205056,
                '30-39': 29559.151408594065,
                '40-49': 70084.4622557842,
                '50-59': 137250.4113364473,
                '60-69': 351262.1009549338,
                '70-79': 456644.6480420906,
                '80+': 466053.5151424797,
                total: 1539961.2115087917,
              },
              critical: {
                '0-9': 2877.325348789197,
                '10-19': 8027.703790798271,
                '20-29': 17311.80877208767,
                '30-39': 28072.930747222992,
                '40-49': 64057.7446536603,
                '50-59': 116026.56506749266,
                '60-69': 269681.1840298037,
                '70-79': 296056.16650469345,
                '80+': 257246.1653498894,
                total: 1059357.5942644377,
              },
              fatality: {
                '0-9': 22.715715311328196,
                '10-19': 133.7949513456685,
                '20-29': 288.5299062078688,
                '30-39': 743.1059259996504,
                '40-49': 3014.296371041925,
                '50-59': 10612.41295982648,
                '60-69': 40792.89581839801,
                '70-79': 80298.92734581283,
                '80+': 104403.54079612068,
                total: 240310.21979006444,
              },
            },
          },
        ],
      },
      R0: {
        lower: [],
        upper: [],
        mean: [],
      },
    }
    const parameters: input.ModelParameters = {
      calibrationDate: '2020-03-15',
      calibrationCaseCount: 300,
      calibrationDeathCount: 50,
      interventionPeriods: [
        {
          startDate: '2020-03-05',
          reductionPopulationContact: 50,
        },
      ],
      r0: null,
    }
    const generalInput: input.ModelInput = {
      region: 'Australia',
      parameters,
    }
    const runInput: BaselRunnerModelInput = {
      binaryPath: 'test-path',
      inputFiles: [],
      modelInput: generalInput,
    }

    const connector = new BaselConnector('test-data-dir')
    const generalOutput = connector.translateOutputFromModel(
      runInput,
      specificOutput
    )

    assert.deepEqual(generalOutput.metadata, generalInput)
    assert.deepEqual(generalOutput.time.extent, [0, 1])
    assert.equal(generalOutput.time.t0, '2020-03-05')
    assert.deepEqual(generalOutput.time.timestamps, [0, 1])
    const expectedMetrics: output.SeverityMetrics = {
      Mild: [0.777098301885928, 0.7770982875767183],
      ILI: [0, 0],
      SARI: [0.17554329404125837, 0.16813732838890916],
      Critical: [1.183028122777987, 1.127354973733367],
      CritRecov: [0, 0],
      // Expected values for incidence are a bit odd when computed from cumulative,
      // as we only have two timestamps in this test data.
      // So the first value is the same as the first cumulative value.
      incDeath: [240310.18046450272, 0.039325561723671854],
      cumMild: [20743342.869650368, 20743343.009535592],
      cumILI: [0, 0],
      cumSARI: [1539961.1981240755, 1539961.2115087917],
      cumCritical: [1059357.5333726155, 1059357.5942644377],
      cumCritRecov: [0, 0],
    }
    // expectedMetrics['cumDeaths'] = [240310.18046450272, 240310.21979006444]
    assert.deepEqual(generalOutput.aggregate.metrics, expectedMetrics)
  })
})
