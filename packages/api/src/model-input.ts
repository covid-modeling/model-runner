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

  /**
   * The total number of confirmed cases in the region before the calibration date.
   */
  calibrationCaseCount: number

  /**
   * The total number of deaths in the region before the calibration date.
   */
  calibrationDeathCount: number

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

export interface InterventionPeriod {
  /**
   * An ISO-8601 string encoding the date that these interventions begin.
   */
  startDate: ISODate

  /**
   * The level of social distancing in the region.
   */
  socialDistancing?: Intensity

  /**
   * The level of school closure in the region.
   */
  schoolClosure?: Intensity

  /**
   * The level to which individuals with symptoms self-isolate.
   */
  caseIsolation?: Intensity

  /**
   * The level to which entire households self-isolate when one member
   * of the household has symptoms.
   */
  voluntaryHomeQuarantine?: Intensity

  /**
   * The estimated reduction in population contact resulting from
   * all of the above interventions. Some models require this generalized
   * parameter instead of the individual interventions.
   */
  reductionPopulationContact: number
}

export type ISODate = string

export enum Intensity {
  Mild = 'mild',
  Moderate = 'moderate',
  Aggressive = 'aggressive',
}
