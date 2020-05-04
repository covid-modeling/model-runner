import { ModelInput } from './model-input'

export interface ModelOutput {
  metadata: ModelInput
  time: {
    /**
     * An ISO-8601 string encoding the date that each timeseries begins.
     */
    t0: string

    /**
     * The timestamps that correspond to every series of metrics.
     * Each value is a number of days after `t0`.
     */
    timestamps: number[]

    /**
     * The minimum and maximum timestamps for the series of reported metrics.
     * Each value is a number of days after `t0`.
     */
    extent: [number, number]
  }
  aggregate: {
    metrics: SeverityMetrics
  }
}

export interface SeverityMetrics {
  /**
   * Current number of mild cases on this day
   */
  Mild: number[]

  /**
   * Current number of influenza-like illness cases on this day (assume represents GP demand)
   */
  ILI: number[]

  /**
   * Current number of Severe Acute Respiratory Illness cases on this day (assume represents hospital demand)
   */
  SARI: number[]

  /**
   * Current number of critical cases on this day (assume represents ICU demand)
   */
  Critical: number[]

  /**
   * Current number of critical cases on this day who are well enough to leave the ICU but still need a hospital bed
   */
  CritRecov: number[]

  /**
   * Number of deaths occurring on this day
   */
  incDeath: number[]

  /**
   * Total number of mild cases since the beginning of the epidemic
   */
  cumMild: number[]

  /**
   * Total number of influence-like illnesses since the beginning of the epidemic
   */
  cumILI: number[]

  /**
   * Total number of severe acute respiratory illnesses since the beginning of the epidemic
   */
  cumSARI: number[]

  /**
   * Total number of critical cases since the beginning of the epidemic
   */
  cumCritical: number[]

  /**
   * Total number of patients recovered from critical cases since the beginning of the epidemic
   */
  cumCritRecov: number[]
}
