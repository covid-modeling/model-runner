import { ModelConnector } from './connector-api'

// See https://github.com/neherlab/covid19_scenarios/blob/$BASEL_VERSION/schemas/

// Input schema: see https://github.com/neherlab/covid19_scenarios/blob/$BASEL_VERSION/src/algorithms/types/Param.types.ts
export interface AgeDistributionArray {
  all: AgeDistributionData[]
}

export interface AgeDistributionData {
  data: AgeDistributionDatum[]
  name: string
}

export interface AgeDistributionDatum {
  ageGroup: AgeGroup
  population: number
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

export interface CaseCountsArray {
  all: CaseCountsData[]
}

export interface CaseCountsData {
  data: CaseCountsDatum[]
  name: string
}

export interface CaseCountsDatum {
  cases: number | null
  deaths?: number | null
  hospitalized?: number | null
  icu?: number | null
  recovered?: number | null
  time: Date
}

export interface ScenarioArray {
  all: ScenarioData[]
}

export interface ScenarioData {
  data: ScenarioDatum
  name: string
}

export interface ScenarioDatum {
  epidemiological: ScenarioDatumEpidemiological
  mitigation: ScenarioDatumMitigation
  population: ScenarioDatumPopulation
  simulation: ScenarioDatumSimulation
}

export interface ScenarioDatumEpidemiological {
  hospitalStayDays: number
  icuStayDays: number
  infectiousPeriodDays: number
  latencyDays: number
  overflowSeverity: number
  peakMonth: number
  r0: NumericRangeNonNegative
  seasonalForcing: number
}

export interface NumericRangeNonNegative {
  begin: number
  end: number
}

export interface ScenarioDatumMitigation {
  mitigationIntervals: MitigationInterval[]
}

export interface MitigationInterval {
  color: string
  name: string
  timeRange: DateRange
  transmissionReduction: PercentageRange
}

export interface DateRange {
  begin: number
  end: number
}

export interface PercentageRange {
  begin: number
  end: number
}

export interface ScenarioDatumPopulation {
  ageDistributionName: string
  caseCountsName: string
  hospitalBeds: number
  icuBeds: number
  importsPerDay: number
  initialNumberOfCases: number
  populationServed: number
}

export interface ScenarioDatumSimulation {
  numberStochasticRuns: number
  simulationTimeRange: DateRange
}

export interface SeverityDistributionArray {
  all: SeverityDistributionData[]
}

export interface SeverityDistributionData {
  data: SeverityDistributionDatum[]
  name: string
}

export interface SeverityDistributionDatum {
  ageGroup: AgeGroup
  confirmed: number
  critical: number
  fatal: number
  isolated: number
  severe: number
}

// Output schema: see https://github.com/neherlab/covid19_scenarios/blob/$BASEL_VERSION/src/algorithms/types/Result.types.ts

export interface ExposedCurrentData {
  susceptible: Record<string, number>
  exposed: Record<string, number>
  infectious: Record<string, number>
  severe: Record<string, number>
  critical: Record<string, number>
  overflow: Record<string, number>
  weeklyFatality: Record<string, number>
}

export interface ExposedCumulativeData {
  recovered: Record<string, number>
  hospitalized: Record<string, number>
  critical: Record<string, number>
  fatality: Record<string, number>
}

export interface TimePoint {
  t: number
  y: number
}

export type TimeSeries = TimePoint[]

// This defines the user-facing data structure
export interface ExportedTimePoint {
  time: number
  current: ExposedCurrentData
  cumulative: ExposedCumulativeData
}

export interface ModelFracs {
  severe: number[]
  critical: number[]
  fatal: number[]
  isolated: number[]
}

export interface ModelRates {
  latency: number
  infection: (t: number) => number
  recovery: number[]
  severe: number[]
  discharge: number[]
  critical: number[]
  stabilize: number[]
  fatality: number[]
  overflowFatality: number[]
}

export interface ModelParams {
  ageDistribution: AgeDistributionDatum[]
  importsPerDay: number[]
  timeDelta: number
  timeDeltaDays: number
  populationServed: number
  numberStochasticRuns: number
  hospitalBeds: number
  icuBeds: number
  frac: ModelFracs
  rate: ModelRates
}

export interface Trajectory {
  middle: ExportedTimePoint[]
  lower: ExportedTimePoint[]
  upper: ExportedTimePoint[]
  percentile: Record<number, ExportedTimePoint[]>
}

export interface TimeSeriesWithRange {
  mean: TimeSeries
  lower: TimeSeries
  upper: TimeSeries
}

export interface PlotDatum {
  time: number
  lines: Record<string, number | undefined>
  areas: Record<string, [number, number] | undefined>
}

export interface AlgorithmResult {
  trajectory: Trajectory
  R0: TimeSeriesWithRange
  plotData: PlotDatum[]
}

export interface BaselModelConnector
  extends ModelConnector<ScenarioData, AlgorithmResult> {}
