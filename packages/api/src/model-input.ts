/**
 * A generalized description of the input to an epidemiological model.
 */
export interface ModelInput {
  region: string
  subregion?: string
  parameters: ModelParameters
}

export interface ModelParameters {
  /**
   * An ISO-8601 string encoding the date of the most recent case data in the region.
   */
  calibrationDate: ISODate

  calibrationData: HistoricalData

  /**
   * The assumed reproduction number for the virus. If this is null, then each
   * model will use its own default value.
   */
  r0: number | null

  /**
   * A list of time periods, each with a different set of interventions.
   */
  interventionPeriods: InterventionPeriod[]
}

export interface HistoricalData {
  endDate: ISODate
  /**
   * The total number of confirmed cases in the region before the calibration date.
   */
  totalCases: number

  /**
   * The total number of deaths in the region before the calibration date.
   */
  totalDeaths: number

  actuals: Actual[]
}

export interface Actual {
  date: ISODate
  cases: number
  cumulativeCases: number
  deaths: number
  cumulativeDeaths: number
  // Eventually we might want to have a sub object with more specific types of mobility?
  mobility?: number
}
export interface InterventionPeriod {
  /**
   * An ISO-8601 string encoding the date that these interventions begin.
   */
  startDate: ISODate

  endDate: ISODate

  inteventions: Intervention[]
  /**
   * The estimated reduction in population contact resulting from
   * all of the above interventions. Some models require this generalized
   * parameter instead of the individual interventions.
   */
  reductionPopulationContact: number
}

export interface Intervention {
  type: InterventionType
  intensity?: Intensity
  reductionPopulationContact?: number
}

export type ISODate = string

export enum Intensity {
  Mild = 'mild',
  Moderate = 'moderate',
  Aggressive = 'aggressive',
}

export enum InterventionType {
  CaseIsolation,
  VoluntaryHomeQuarantine,
  SocialDistancing,
  SchoolClosure,
  WorkplaceClosure,
  CancelPublicEvents,
  RestrictGatherings,
  StayAtHome,
  RestrictInternalMovement,
  RestrictInternationalTravel,
}
