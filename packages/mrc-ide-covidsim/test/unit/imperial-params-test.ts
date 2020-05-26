import { assert } from 'chai'
import * as params from '../../src/imperial-params'
import { parse, serialize } from '../../src/imperial-params'
import { input } from '@covid-modeling/api'

suite('the imperial model parameter format', () => {
  test('parse parameter file', () => {
    const params = parse(`
[a number]
1.0
^^ a comment

//// A second comment
[an array]
1.0\t2.0\t3.0

=====

[a number in a new section]
1

*** ^^ another comment

[a matrix]
1\t2\t3
4\t5\t6
`)

    assert.deepEqual(params, {
      'a number': 1.0,
      'an array': [1.0, 2.0, 3.0],
      'a number in a new section': 1,
      'a matrix': [
        [1, 2, 3],
        [4, 5, 6],
      ],
    })
  })

  test('parse parameter file with missing values', () => {
    const data = parse(`
[a]
1.0

[b]
#1

[c]
2.0

[d]
#2

        `)

    assert.deepEqual(data, {
      a: 1.0,
      c: 2.0,
    })
  })

  test('parse parameter file with strings', () => {
    const data = parse(`
[a]
District_of_Columbia	Florida	Georgia

[b]
610100	United_States	Alabama
610200	United_States	Alaska
        `)

    assert.deepEqual(data, {
      a: ['District_of_Columbia', 'Florida', 'Georgia'],
      b: [
        [610100, 'United_States', 'Alabama'],
        [610200, 'United_States', 'Alaska'],
      ],
    })
  })

  test('generate parameter data', () => {
    const text = serialize({
      'a number': 1.0,
      'an array': [1.0, 2.0, 3.0],
      'a matrix': [
        [1, 2, 3],
        [4, 5, 6],
      ],
    })

    assert.equal(
      text,
      `
[a number]
1

[an array]
1\t2\t3

[a matrix]
1\t2\t3
4\t5\t6
`.trimLeft()
    )
  })

  test('generate parameter data with missing values throws an error', () => {
    assert.throws(() => {
      serialize({
        a: 1.0,
        'some parameter': undefined,
        c: 2.0,
      })
    }, "Missing value for Imperial model parameter 'some parameter'")
  })

  test('generate parameter data with strings', () => {
    const text = serialize({
      a: ['District_of_Columbia', 'Florida', 'Georgia'],
      b: [
        [610100, 'United_States', 'Alabama'],
        [610200, 'United_States', 'Alaska'],
      ],
    })

    assert.deepEqual(
      text,
      `
[a]
District_of_Columbia	Florida	Georgia

[b]
610100	United_States	Alabama
610200	United_States	Alaska
`.trimLeft()
    )
  })

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

  test('handles alert trigger starts before interventions', () => {
    const parameters = {
      calibrationDate: '2020-02-20',
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
      ],
    }
    const pp = {}

    params.assignPreParameters(pp, parameters)

    assert.equal(pp['Alert trigger starts after interventions'], 0)
  })
})
