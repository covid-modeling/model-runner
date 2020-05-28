import { assert } from 'chai'
import * as params from '../../src/imperial-params'
import * as paramsSerialization from '../../src/params-serialization'
import { input } from '@covid-modeling/api'

suite('the imperial model parameter format', () => {
  test('handles intervention strategies', () => {
    const parameters = {
      calibrationDate: '2020-03-20',
      calibrationCaseCount: 500,
      calibrationDeathCount: 120,
      r0: 2.5,
      interventionPeriods: [
        // Initial intervention
        {
          startDate: '2020-03-01',
          reductionPopulationContact: 9,
          caseIsolation: input.Intensity.Moderate,
          socialDistancing: input.Intensity.Mild,
        },
        // Close schools, make social distancing more aggressive
        {
          startDate: '2020-03-10',
          reductionPopulationContact: 10,
          caseIsolation: input.Intensity.Aggressive,
          voluntaryHomeQuarantine: input.Intensity.Moderate,
          socialDistancing: input.Intensity.Aggressive,
          schoolClosure: input.Intensity.Aggressive,
        },
        // Reopen schools mostly
        {
          startDate: '2020-03-20',
          reductionPopulationContact: 10,
          caseIsolation: input.Intensity.Aggressive,
          voluntaryHomeQuarantine: input.Intensity.Moderate,
          socialDistancing: input.Intensity.Moderate,
          schoolClosure: input.Intensity.Mild,
        },
        // Return to normal
        {
          startDate: '2020-03-30',
          reductionPopulationContact: 0,
          caseIsolation: input.Intensity.Moderate,
          voluntaryHomeQuarantine: input.Intensity.Mild,
        },
      ],
    }

    const p: Record<string, number | number[] | number[][]> = {
      'Trigger incidence per cell for social distancing over time': [100, 100],
      'Household quarantine trigger incidence per cell': 100000,
    }
    params.assignParameters(p, parameters)
    assert.deepEqual(p, {
      'Vary efficacies over time': 1,
      'Number of change times for levels of case isolation': 4,
      'Number of change times for levels of household quarantine': 4,
      'Number of change times for levels of social distancing': 4,
      'Number of change times for levels of place closure': 4,
      'Change times for levels of case isolation': [0, 9, 19, 29],
      'Change times for levels of household quarantine': [0, 9, 19, 29],
      'Change times for levels of place closure': [0, 9, 19, 29],
      'Change times for levels of social distancing': [0, 9, 19, 29],

      'Case isolation start time': 0,
      'Duration of case isolation policy': 10000,
      'Proportion of detected cases isolated over time': [0.75, 0.9, 0.9, 0.75],

      'Household quarantine start time': 0,
      'Duration of household quarantine policy': 10000,
      'Household level compliance with quarantine over time': [
        0,
        0.75,
        0.75,
        0.5,
      ],

      'Social distancing start time': 0,
      'Duration of social distancing': 10000,
      'Relative spatial contact rates over time given social distancing': [
        0.5,
        0.1,
        0.25,
        1,
      ],

      'Place closure start time': 0,
      'Duration of place closure': 10000,
      'Proportion of places remaining open after closure by place type over time': [
        [1, 1, 1, 1],
        [0.1, 0.1, 0.1, 1],
        [0.5, 0.5, 0.5, 1],
        [1, 1, 1, 1],
      ],
      'Duration of place closure over time': [10000, 10000, 10000, 10000],

      'Trigger incidence per cell for social distancing over time': [
        0,
        0,
        0,
        0,
      ],
      'Household quarantine trigger incidence per cell': 0,
    })

    const pp = {}
    params.assignPreParameters(pp, parameters)
    assert.deepEqual(pp, {
      'Alert trigger starts after interventions': 1,
      'Trigger alert on deaths': 1,
      'Day of year interventions start': 60,
      'Day of year trigger is reached': 79,
      'Number of days to accummulate cases/deaths before alert': 1000,
      'Number of deaths accummulated before alert': 120,
      'Treatment trigger incidence per cell': 0,
    })
  })

  test('ensures that all time-varying efficacies have the same length', () => {
    const parameters = {
      calibrationDate: '2020-03-20',
      calibrationCaseCount: 500,
      calibrationDeathCount: 120,
      r0: null,

      // 5 periods
      interventionPeriods: [
        {
          startDate: '2020-03-01',
          reductionPopulationContact: 10,
          schoolClosure: input.Intensity.Moderate,
        },
        {
          startDate: '2020-03-10',
          reductionPopulationContact: 0,
        },
        {
          startDate: '2020-03-20',
          reductionPopulationContact: 50,
          schoolClosure: input.Intensity.Moderate,
        },
        {
          startDate: '2020-04-01',
          reductionPopulationContact: 0,
        },
        {
          startDate: '2020-04-10',
          reductionPopulationContact: 0,
          schoolClosure: input.Intensity.Moderate,
        },
      ],
    }

    const p = {
      // 3 values
      'Relative household contact rates over time after place closure': [
        0.5,
        0.5,
        0.5,
      ],
      'Relative spatial contact rates over time after place closure': [
        0.6,
        0.6,
        0.6,
      ],
      // 8 values
      'Relative household contact rates over time after quarantine': [
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
        0.8,
      ],

      // 5 values
      'Residual contacts after case isolation over time': [
        0.4,
        0.4,
        0.4,
        0.4,
        0.4,
      ],
    }

    params.assignParameters(p, parameters)

    assert.deepEqual(
      p['Relative household contact rates over time after place closure'],
      [0.5, 0.5, 0.5, 0.5, 0.5]
    )
    assert.deepEqual(
      p['Relative spatial contact rates over time after place closure'],
      [0.6, 0.6, 0.6, 0.6, 0.6]
    )
    assert.deepEqual(
      p['Relative household contact rates over time after quarantine'],
      [0.8, 0.8, 0.8, 0.8, 0.8]
    )
    assert.deepEqual(p['Residual contacts after case isolation over time'], [
      0.4,
      0.4,
      0.4,
      0.4,
      0.4,
    ])
  })

  test('ensures parameters are set to 0 properly', () => {
    const p = paramsSerialization.parse(`
  [Something something enhanced]
  9 9 9 9
  9 9 9 9

  [Something something incidence threshold]
  9 9

  [Something something after change]
  9
`)
    const modelParams = {
      interventionPeriods: [
        { startDate: '2020-03-05' },
        { startDate: '2020-03-06' },
        { startDate: '2020-03-07' },
      ],
      calibrationDeathCount: 100,
      calibrationDate: '2020-03-04',
    }
    params.assignParameters(p, modelParams as input.ModelParameters)
    const output = paramsSerialization.serialize(p)
    assert.equal(
      output,
      `[Vary efficacies over time]
1

[Number of change times for levels of case isolation]
3

[Number of change times for levels of household quarantine]
3

[Number of change times for levels of social distancing]
3

[Number of change times for levels of place closure]
3

[Change times for levels of case isolation]
0\t1\t2

[Change times for levels of household quarantine]
0\t1\t2

[Change times for levels of social distancing]
0\t1\t2

[Change times for levels of place closure]
0\t1\t2

[Case isolation start time]
0

[Duration of case isolation policy]
10000

[Proportion of detected cases isolated over time]
0\t0\t0

[Household quarantine start time]
0

[Duration of household quarantine policy]
10000

[Household level compliance with quarantine over time]
0\t0\t0

[Social distancing start time]
0

[Duration of social distancing]
10000

[Relative spatial contact rates over time given social distancing]
1\t1\t1

[Place closure start time]
0

[Duration of place closure]
10000

[Duration of place closure over time]
10000\t10000\t10000

[Proportion of places remaining open after closure by place type over time]
1\t1\t1\t1
1\t1\t1\t1
1\t1\t1\t1\n`
    )
  })

  test('setParameterFamilyTo0 with single value', () => {
    const p = {
      'Xxx yyy zzz': 9,
      'xx yyy zzz': 9,
    }
    params.setParameterFamilyTo0(p, 'xXx', 999)
    assert.deepEqual(p, {
      'Xxx yyy zzz': 0,
      'xx yyy zzz': 9,
    })
  })

  test('setParameterFamilyTo0 with array value', () => {
    const p = {
      'Xxx yyy zzz': [9, 9],
      'xx yyy zzz': 9,
    }
    params.setParameterFamilyTo0(p, 'xXx', 4)
    assert.deepEqual(p, {
      'Xxx yyy zzz': [0, 0],
      'xx yyy zzz': 9,
    })
  })

  test('setParameterFamilyTo0 with array value over time', () => {
    const p = {
      'Xxx yyy zzz over time': [9, 9],
      'xx yyy zzz': 9,
    }
    params.setParameterFamilyTo0(p, 'xXx', 4)
    assert.deepEqual(p, {
      'Xxx yyy zzz over time': [0, 0, 0, 0],
      'xx yyy zzz': 9,
    })
  })

  test('setParameterFamilyTo0 with multi-array value', () => {
    const p = {
      'Xxx yyy zzz': [
        [9, 9],
        [9, 9],
        [9, 9],
      ],
      'xx yyy zzz': 9,
    }
    params.setParameterFamilyTo0(p, 'xXx', 4)
    assert.deepEqual(p, {
      'Xxx yyy zzz': [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      'xx yyy zzz': 9,
    })
  })

  test('setParameterFamilyTo0 with multi-array value over time', () => {
    const p = {
      'Xxx yyy zzz over time': [
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
        [9, 9],
      ],
      'xx yyy zzz': 9,
    }
    params.setParameterFamilyTo0(p, 'xXx', 4)
    assert.deepEqual(p, {
      'Xxx yyy zzz over time': [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      'xx yyy zzz': 9,
    })
  })
})
