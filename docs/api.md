# Model-runner API

## Input

Model-runner takes a JSON input file whose structure is described by the `RequestInput` type in [`api/src/index.ts`](/packages/api/src/index.ts) (or alternatively, the `RequestInput` JSON schema in [`api/schema/input.json`](/packages/api/schema/input.json)). See those files for comments about the each field. This section gives a high-level overview of the inputs.

The `RequestInput` object contains `callbackURL` and `id` fields which allow it to notify the website when simulation runs start and end. The remainder of the input data is contained within the nested `configuration` object.

### Calibration

Some models such as `CovidSim` require you to provide some information about recorded cases in the region, in order to calibrate the model. Model-runner takes this information in the form of three fields: `calibrationDate`, `calibrationCaseCount`, and `calibrationDeathCount`. The website `covid-modeling.org` provides this information automatically, based on recorded case data downloaded daily from data sources like [covidtracking.com](https://covidtracking.com), and the John Hopkins [Center for Systems Science and Engineering](https://github.com/CSSEGISandData/COVID-19).

### Reproduction Number (R0)

The virus's [_reproduction number_](https://en.wikipedia.org/wiki/Basic_reproduction_number) (R0) can be specified explicitly or left unspecified. If it is left unspecified, each model will use its own default value of R0.

### Interventions

Policy interventions are specified as a series of _intervention periods_, each with a certain set of interventions that are in place. For example, case isolation and social distancing may be instituted first, followed by school closure a week later, followed by a relaxation of all guidelines after several months.

Each of these intervention periods is specified by a `startDate`, a set of interventions (`socialDistancing`, `caseIsolation`, `voluntaryHomeQuarantine`, and `schoolClosure`), and an estimate of the overall effect of these interventions (`reductionPopulationContact`). This overall estimate is needed because some models do not simulate the effects of individual interventions.

The strictness of each intervention is specified roughly, as one of `mild`, `moderate`, or `aggressive`. Each model connector is responsible for interpreting this distinction in a way that works for the particular model.

**Note** - In order to specify that _all_ interventions end on a certain date, there should be a _final_ intervention period that starts on that date, has no interventions specified, and has `reductionPopulationContact` set to zero.

## Output

When a simulation completes, Model-runner creates a JSON file whose structure is described by the `ModelOutput` type in [`api/src/model-output.ts`](/packages/api/src/model-output.ts) (or the `ModelOutput` JSON schema in [`api/schema/output.json`](/packages/api/schema/output.json)).

### Timestamps

Models may differ in how long of a time period they simulate, and how fine-grained their metrics are. The output JSON contains fields that indicate the times that each predicted metric corresponds to. The `t0` field indicates the start date for the simulation, and the `timestamps` field indicates the dates that each metrics timeseries refers to. Each value in `timestamps` is a number of days since `t0`.

### Metrics

The output contains a number of time series which represent predicted metrics about the epidemic. Three kinds of metrics are reported:

- **Current values** - These metrics (e.g. `Mild`, `Critical`) represent the current number of patients in a given condition, on a particular date. For example, the `Critical` value at a given timestamp represents the number of patients in critical condition on that day.
- **Cumulative values** - These metrics (e.g. `cumMild`, `cumCritical`) represent the total number of people who have been afflicted with a given condition since the beginning of the epidemic. For example, the `cumCritical` value at a given timestamp represents the total number of people who had been in critical condition due to the virus any time leading up to that day.
- **Incidence values** - The `incDeath` metric represents the number of patients who died of the virus on a given day.
