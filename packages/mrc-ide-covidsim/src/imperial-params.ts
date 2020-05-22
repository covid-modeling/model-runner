import { output, input } from '@covid-modeling/api'
import { DateTime } from 'luxon'
import * as assert from 'assert'

const SEPARATOR_REGEX = /[ \t]/
const ENTRY_REGEX = /^[A-Za-z0-9#]/

// Parse the contents of an imperial parameter file
export function parse(text: string): {} {
  const result = {}
  const lines = text.split('\n')
  const n = lines.length
  let i = 0
  while (i < n) {
    const line = lines[i].trimRight()
    i++
    if (line.startsWith('[')) {
      if (line.endsWith(']')) {
        const key = line.slice(1, -1)
        let str = ''
        while (i < n && ENTRY_REGEX.test(lines[i])) {
          str += '\n' + lines[i]
          i++
        }
        try {
          const value = parseValue(str)
          if (value != null) {
            result[key] = value
          }
        } catch (_) {
          throw new Error(`Unable to parse the value for key '${key}': ${str}`)
        }
      } else {
        throw new Error(`Expected a closing square bracket on line ${i}`)
      }
    }
  }
  return result
}

// Generate the content for an imperial parameter file.
export function serialize(data: {}): string {
  let result = ''
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = serializeValue(data[key])
      if (value == null) {
        throw new Error(`Missing value for Imperial model parameter '${key}'`)
      }
      result += '[' + key + ']\n' + value + '\n\n'
    }
  }
  return result.slice(0, -1)
}

// Parse an individual value in an imperial parameter file
function parseValue(text) {
  text = text.trim()

  // Parse multi-line matrices
  if (text.includes('\n')) {
    return text.split('\n').map(parseValue)
  }

  // Parse tab-separated arrays
  if (SEPARATOR_REGEX.test(text)) {
    return text.split(SEPARATOR_REGEX).map(parseValue)
  }

  if (text.startsWith('#')) {
    return null
  }

  const float = Number.parseFloat(text)
  if (Number.isNaN(float)) {
    return text
  } else {
    return float
  }
}

// Serialize an individual value in an imperial parameter file
function serializeValue(value) {
  if (Array.isArray(value)) {
    // Serialize a 2D matrix as a multi-line array.
    if (Array.isArray(value[0])) {
      return value.map(serializeValue).join('\n')
    }

    // Serialize a 1D array as a tab-separated line
    else {
      return value.map(serializeValue).join('\t')
    }
  } else if (value != null) {
    return String(value)
  } else {
    return null
  }
}

const day0 = dateFromAPI('2020-01-01')

function dateFromAPI(isoDate: string): DateTime {
  return DateTime.fromISO(isoDate, { zone: 'utc' })
}

function daysBetween(t0: DateTime, t1: DateTime): number {
  return t1.diff(t0, 'days').days
}

export function assignPreParameters(p: {}, input: input.ModelParameters) {
  const calibrationDate = dateFromAPI(input.calibrationDate)
  const interventionStart =
    input.interventionPeriods.length > 0
      ? dateFromAPI(input.interventionPeriods[0].startDate)
      : DateTime.utc()

  const calibrationDays = daysBetween(day0, calibrationDate)
  const interventionStartDays = daysBetween(day0, interventionStart)

  p['Day of year trigger is reached'] = calibrationDays
  p['Number of days to accummulate cases/deaths before alert'] = 1000
  p['Number of deaths accummulated before alert'] = input.calibrationDeathCount
  p['Trigger alert on deaths'] = 1

  p['Day of year interventions start'] = interventionStartDays

  // if calibration date is before first intervention date, set to 0
  p['Alert trigger starts after interventions'] =
    calibrationDays < interventionStartDays ? 0 : 1

  p['Treatment trigger incidence per cell'] = 0
}

export function assignParameters(p: {}, input: input.ModelParameters) {
  // Intervention timing
  const periodCount = input.interventionPeriods.length
  if (periodCount === 0) return
  p['Vary efficacies over time'] = 1

  // Ensure that, for any time-varying intervention efficacies that we don't
  // override, there are the right number of values.
  for (const key of [
    'Relative household contact rates over time after place closure',
    'Relative spatial contact rates over time after place closure',
    'Place closure incidence threshold over time',
    'Place closure fractional incidence threshold over time',
    'Relative household contact rates over time after quarantine',
    'Residual place contacts over time after household quarantine by place type',
    'Residual spatial contacts over time after household quarantine',
    'Household level compliance with quarantine over time',
    'Individual level compliance with quarantine over time',
    'Residual contacts after case isolation over time',
    'Residual household contacts after case isolation over time',
    'Proportion of detected cases isolated over time',
    'Relative place contact rates over time given social distancing by place type',
    'Relative household contact rates over time given social distancing',
    'Relative spatial contact rates over time given social distancing',
    'Relative household contact rates over time given enhanced social distancing',
    'Relative spatial contact rates over time given enhanced social distancing',
    'Relative place contact rates over time given enhanced social distancing by place type',
  ]) {
    const value = p[key]
    if (value) {
      assert(Array.isArray(value))
      const oldLength = value.length
      value.length = periodCount
      value.fill(value[0], oldLength)
    }
  }

  // Set all trigger incidences to 0 because we do not support adaptive triggers
  Object.entries(p)
    .filter(([key]) => key.includes('rigger incidence'))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        p[key] = new Array(periodCount).fill(0)
      } else {
        p[key] = 0
      }
    })

  p['Number of change times for levels of case isolation'] = periodCount
  p['Number of change times for levels of household quarantine'] = periodCount
  p['Number of change times for levels of social distancing'] = periodCount
  p['Number of change times for levels of place closure'] = periodCount

  const interventionsStart = dateFromAPI(input.interventionPeriods[0].startDate)
  const interventionTimes = input.interventionPeriods.map(i =>
    daysBetween(interventionsStart, dateFromAPI(i.startDate))
  )
  p['Change times for levels of case isolation'] = interventionTimes
  p['Change times for levels of household quarantine'] = interventionTimes
  p['Change times for levels of social distancing'] = interventionTimes
  p['Change times for levels of place closure'] = interventionTimes

  // Case isolation
  p['Case isolation start time'] = 0
  p['Duration of case isolation policy'] = 10000
  p[
    'Proportion of detected cases isolated over time'
  ] = input.interventionPeriods.map(p =>
    proportionForIntensity(p.caseIsolation)
  )

  // Household quarantine
  p['Household quarantine start time'] = 0
  p['Duration of household quarantine policy'] = 10000
  p[
    'Household level compliance with quarantine over time'
  ] = input.interventionPeriods.map(p =>
    proportionForIntensity(p.voluntaryHomeQuarantine)
  )

  // Social distancing
  p['Social distancing start time'] = 0
  p['Duration of social distancing'] = 10000
  p[
    'Relative spatial contact rates over time given social distancing'
  ] = input.interventionPeriods.map(p =>
    invertProportion(proportionForIntensity(p.socialDistancing))
  )

  // School closure
  p['Place closure start time'] = 0
  p['Duration of place closure'] = 10000
  p['Duration of place closure over time'] = new Array(
    input.interventionPeriods.length
  ).fill(10000)
  p[
    'Proportion of places remaining open after closure by place type over time'
  ] = input.interventionPeriods.map(p => {
    const proportion = invertProportion(proportionForIntensity(p.schoolClosure))
    return [
      proportion, // primary school
      proportion, // secondary school
      proportion, // university
      1, // office
    ]
  })
}

export function assignAdminParameters(p: {}, subregionName: string) {
  p['Include holidays'] = 0
  p['Fix population size at specified value'] = 0
  p['Number of countries to include'] = 0
  p['Number of level 1 administrative units to include'] = 1
  p['List of level 1 administrative units to include'] = subregionName

  // For now, we need to remove unused entries from the admin unit name lookup table.
  // Note: The way filter is used assumes the the entry is an [[]], but if it is a single line it
  // will only be [] and the filter will fail. Be careful which admin files you use this with.
  const adminUnitNameLookup = p[
    'Codes and country/province names for admin units'
  ].filter(row => row[2] === subregionName)
  if (adminUnitNameLookup.length !== 1) {
    throw new Error(
      `Could not find entry for '${subregionName}' in 'Codes and country/province names for admin units' parameter: ${JSON.stringify(
        p['Codes and country/province names for admin units']
      )}`
    )
  }

  p['Codes and country/province names for admin units'] = adminUnitNameLookup
}

function proportionForIntensity(i?: input.Intensity): number {
  switch (i) {
    case input.Intensity.Mild:
      return 0.5
    case input.Intensity.Moderate:
      return 0.75
    case input.Intensity.Aggressive:
      return 0.9
    default:
      return 0
  }
}

function invertProportion(p: number): number {
  return (100 - p * 100) / 100
}
