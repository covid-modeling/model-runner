import { ModelConnector } from './connector-api'

// Input schema. Taken from https://github.com/neherlab/covid19_scenarios/blob/a170135a183f1c98b45c01a75e08b0620af6cdbe/src/algorithms/types/Param.types.ts
export interface Scenario {
  allParams: AllParams
  country: string
}

export interface AllParams {
  containment: ContainmentData
  epidemiological: EpidemiologicalData
  population: PopulationData
  simulation: SimulationData
}

export interface ContainmentData {
  mitigationIntervals: MitigationInterval[]
  numberPoints?: number
}

export interface MitigationInterval {
  color: string
  id: string
  mitigationValue: number
  name: string
  timeRange: DateRange
}

export interface DateRange {
  tMax: Date
  tMin: Date
}

export interface EpidemiologicalData {
  infectiousPeriod: number
  latencyTime: number
  lengthHospitalStay: number
  lengthICUStay: number
  overflowSeverity: number
  peakMonth: number
  r0: number
  seasonalForcing: number
}

export interface PopulationData {
  cases: string
  country: string
  hospitalBeds: number
  ICUBeds: number
  importsPerDay: number
  initialNumberOfCases: number
  populationServed: number
}

export interface SimulationData {
  numberStochasticRuns: number
  simulationTimeRange: DateRange
}

export interface Severity {
  ageGroup: AgeGroup
  confirmed: number
  critical: number
  fatal: number
  id: number
  isolated: number
  severe: number
}

export enum AgeGroup {
  The09 = '0-9',
  The1019 = '10-19',
  The2029 = '20-29',
  The3039 = '30-39',
  The4049 = '40-49',
  The5059 = '50-59',
  The6069 = '60-69',
  The7079 = '70-79',
  The80 = '80+',
}

// Output schema. Taken from https://github.com/neherlab/covid19_scenarios/blob/3532e67999571c3992bc6e7b7f605e678633a07b/src/algorithms/types/Result.types.ts
export interface ExposedCurrentData {
  susceptible: Record<string, number>
  exposed: Record<string, number>
  infectious: Record<string, number>
  severe: Record<string, number>
  critical: Record<string, number>
  overflow: Record<string, number>
}

export interface CumulativeData {
  recovered: Record<string, number>
  hospitalized: Record<string, number>
  critical: Record<string, number>
  fatality: Record<string, number>
}

// This defines the user-facing data structure
export interface ExportedTimePoint {
  time: number
  current: ExposedCurrentData
  cumulative: CumulativeData
}

export interface ModelFracs {
  severe: Record<string, number>
  critical: Record<string, number>
  fatal: Record<string, number>
  isolated: Record<string, number>
}

export interface ModelRates {
  latency: number
  infection: (t: Date) => number
  recovery: Record<string, number>
  severe: Record<string, number>
  discharge: Record<string, number>
  critical: Record<string, number>
  stabilize: Record<string, number>
  fatality: Record<string, number>
  overflowFatality: Record<string, number>
}

export interface ModelParams {
  ageDistribution: Record<string, number>
  importsPerDay: Record<string, number>
  timeDelta: number
  timeDeltaDays: number
  populationServed: number
  numberStochasticRuns: number
  hospitalBeds: number
  ICUBeds: number
  frac: ModelFracs
  rate: ModelRates
}

export interface UserResult {
  trajectory: ExportedTimePoint[]
}

export interface AlgorithmResult {
  deterministic: UserResult
  stochastic: UserResult[]
  params: ModelParams
}

export interface BaselModelConnector
  extends ModelConnector<Scenario, AlgorithmResult> {}
