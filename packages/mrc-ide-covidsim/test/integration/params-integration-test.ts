import * as temp from 'temp'
import { assert } from 'chai'
import { ImperialModel } from '../../src/imperial'
import { MODEL_DATA_DIR } from '../../src/config'
import { input } from '@covid-modeling/api'
import { parse } from '../../src/params-serialization'
import * as fs from 'fs'

suite('configuration validation', () => {
  const modelInput: input.ModelInput = {
    region: 'US',
    subregion: 'US-CA',
    parameters: {
      calibrationDate: '2020-05-09',
      calibrationCaseCount: 64561,
      calibrationDeathCount: 2678,
      r0: 2.2,
      interventionPeriods: [
        {
          startDate: '2020-03-19',
          reductionPopulationContact: 74,
          caseIsolation: input.Intensity.Aggressive,
          socialDistancing: input.Intensity.Aggressive,
          voluntaryHomeQuarantine: input.Intensity.Aggressive,
        },
        {
          startDate: '2020-03-31',
          reductionPopulationContact: 78,
          caseIsolation: input.Intensity.Aggressive,
          schoolClosure: input.Intensity.Aggressive,
          socialDistancing: input.Intensity.Aggressive,
          voluntaryHomeQuarantine: input.Intensity.Aggressive,
        },
      ],
    },
  }

  const logDir = temp.mkdirSync()
  const inputDir = temp.mkdirSync()
  const outputDir = temp.mkdirSync()
  const binDir = temp.mkdirSync()

  const model = new ImperialModel(
    1,
    binDir,
    logDir,
    MODEL_DATA_DIR,
    inputDir,
    outputDir
  )

  const runnerModelInput = model.inputs(modelInput)

  test('validate US-CA admin file', () => {
    const adminParamsText = fs.readFileSync(
      runnerModelInput.adminFilePath,
      'utf8'
    )
    const adminParams = parse(adminParamsText)

    assert.include(adminParams, {
      ['Include holidays']: 0,
      ['Fix population size at specified value']: 0,
      ['Number of countries to include']: 0,
      ['Number of level 1 administrative units to include']: 1,
      ['List of level 1 administrative units to include']: 'California',
    })
  })

  test('validate US-CA pre-param file', () => {
    const preParamsText = fs.readFileSync(
      runnerModelInput.preParametersFilePath,
      'utf8'
    )
    const preParams = parse(preParamsText)

    assert.doesNotHaveAnyKeys(preParams, [
      'Number of detected cases needed before outbreak alert triggered',
    ])

    // Validate static settings
    assert.include(preParams, {
      ['Number of days to accummulate cases/deaths before alert']: 1000,
      ['Trigger alert on deaths']: 1,
      ['Alert trigger starts after interventions']: 1,
      ['Treatment trigger incidence per cell']: 0,
      ['Places close only once']: 0,
      ['Social distancing only once']: 0,
    })

    // Validate dynamic settings
    assert.include(preParams, {
      ['Day of year trigger is reached']: 130,
      ['Number of deaths accummulated before alert']: 2678,
      ['Day of year interventions start']: 79,
    })
  })

  test('validate US-CA params file', () => {
    const paramsText = fs.readFileSync(
      runnerModelInput.parametersFilePath,
      'utf8'
    )
    const params = parse(paramsText)

    // Validate static settings
    assert.deepInclude(params, {
      ['Vary efficacies over time']: 1,
      ['Place closure incidence threshold']: 0,
      ['Place closure fractional incidence threshold']: 0,
      ['Household quarantine trigger incidence per cell']: 0,
      ['Case isolation trigger incidence per cell']: 0,
      ['Trigger incidence per cell for place closure']: 0,
      ['Trigger incidence per cell for place closure over time']: [0, 0],
      ['Trigger incidence per cell for social distancing']: 0,
      ['Trigger incidence per cell for social distancing over time']: [0, 0],
      ['Place closure incidence threshold over time']: [0, 0],
      ['Place closure fractional incidence threshold over time']: [0, 0],
      ['Case isolation start time']: 0,
      ['Duration of case isolation policy']: 10000,
      ['Household quarantine start time']: 0,
      ['Duration of household quarantine policy']: 10000,
      ['Social distancing start time']: 0,
      ['Duration of social distancing']: 10000,
      ['Place closure start time']: 0,
      ['Duration of place closure']: 10000,
      ['Relative place contact rates over time given enhanced social distancing by place type']: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    })

    // Validate dynamic settings
    assert.deepInclude(params, {
      ['Number of change times for levels of case isolation']: 2,
      ['Number of change times for levels of household quarantine']: 2,
      ['Number of change times for levels of social distancing']: 2,
      ['Number of change times for levels of place closure']: 2,
      ['Change times for levels of case isolation']: [0, 12],
      ['Change times for levels of household quarantine']: [0, 12],
      ['Change times for levels of social distancing']: [0, 12],
      ['Change times for levels of place closure']: [0, 12],
      ['Proportion of detected cases isolated over time']: [0.9, 0.9],
      ['Household level compliance with quarantine over time']: [0.9, 0.9],
      ['Relative spatial contact rates over time given social distancing']: [
        0.1,
        0.1,
      ],
      ['Duration of place closure over time']: [10000, 10000],
      ['Proportion of places remaining open after closure by place type over time']: [
        [1, 1, 1, 1],
        [0.1, 0.1, 0.1, 1],
      ],
    })
  })
})
