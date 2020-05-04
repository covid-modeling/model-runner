# Covid Model-Runner

The `model-runner` service provides a common interface for running epidemiological models and is primarily written in TypeScript. This repository contains a package to run models, model connectors that translate data to/from models and the runner, and a shared API for this communication.

The `model-runner` service takes a JSON object as input describing assumptions, interventions, and a target model to run. It runs a Docker image containing a _connector_ for the target model, and produces a JSON object as output describing predicted public health outcomes over time. The [input](/packages/api/schema/input.json) and [output](/packages/api/schema/output.json) schemas are common across all supported models. [See below](#connectors) for more information about model connectors.

This project is currently in production and actively maintained. We are happy to accept [contributions](CONTRIBUTING.md) for new model connectors from the community.

To learn more about this project's goals, please see [PROJECT-INTENT.md](https://github.com/covid-modeling/web-ui/blob/master/PROJECT-INTENT.md)

## Links

- See [the API doc](/docs/api.md) for a detailed description of the JSON inputs and output.
- See [the architecture doc](/docs/architecture.md) for an explanation of the architecture.
- See [the adding models doc](/docs/adding-models.md) for information about how to add support for other models.

## Repository structure

This project uses [Lerna](https://lerna.js.org/) for handling a node mono-repo. You can find the subprojects in the [`packages`](/packages) directory.

### TypeScript Packages

- [`model-runner`](/packages/model-runner): holds the runner code. ![Model Runner-Build, Test & Publish Docker](https://github.com/covid-modeling/model-runner/workflows/Model%20Runner-Build,%20Test%20&%20Publish%20Docker/badge.svg)
- [`api`](/packages/api): holds the shared API used by all connectors to specify inputs and outputs in a common schema.

### Connectors

Each of these packages contains code for packaging and executing a specific model in this system using a Docker image. This includes code for executing the model, along with connector code to transform input and output between the model-runner's schema and the format expected by the model. See [the architecture document](/docs/architecture.md#connectors) for more information on the connector format.

- [`mrc-ide-covidsim`](/packages/mrc-ide-covidsim) holds connector code for the CovidSim model from Imperial College. ![MRC-IDE CovidSim Connector-Build, Test & Publish Docker](https://github.com/covid-modeling/model-runner/workflows/MRC-IDE%20CovidSim%20Connector-Build,%20Test%20&%20Publish%20Docker/badge.svg)
- [`neherlab-covid19-scenarios`](/packages/neherlab-covid19-scenarios) holds the connector code for the Basel model from Neher Lab at Biozentrum Basel. ![Basel Connector-Build, Test & Publish Docker](https://github.com/covid-modeling/model-runner/workflows/Basel%20Connector-Build,%20Test%20&%20Publish%20Docker/badge.svg)
- [`modelingcovid-covidmodel`](/packages/modelingcovid-covidmodel) holds the connector code for the MC19 model developed by the Modeling Covid-19 team, with team members from Stripe, Harvard, and Stanford. ![MC19 Connector-Build, Test & Publish Docker](https://github.com/covid-modeling/model-runner/workflows/MC19%20Connector-Build,%20Test%20&%20Publish%20Docker/badge.svg)
- Other model connector subprojects may be added here in future.

## Dependencies

`model-runner` requires the following software to be installed:

For working with the TypeScript portion of the project:

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/en/)
- [Lerna](https://lerna.js.org/) module:

    ```sh
    npm i -g lerna
    ```

If you want to build a new version of any of the models, you will need additional tools such as a C compiler.

## Building, developing, and testing

The model-runner package and some of the connectors are written in TypeScript. The models themselves are external and must be built and packaged separately.

### Building

To install all dependencies and compile the TypeScript:

```sh
lerna bootstrap
lerna run build
```

Because this is a Lerna project, most dependencies are hoisted to the top-level, root `node_modules` directory.

### Testing on the command line

To run the unit and integration tests from the command line for all packages:

```sh
lerna run test
lerna run integration-test
```

### Testing a connector using Docker

To build the connector using Docker and run its tests:

```sh
cd packages/<connector>
docker-compose build test
```

### Running a connector using Docker

The simplest way to build and run a connector is to use its Docker image.
For most connectors, the Docker image will import another Docker image that contains the model (this model image may be published to GitHub Packages on the model's repository).
To see which version of the model image is being used, check the files `.env` and `Dockerfile` within the connector package.

To build the model and connector in a Docker image and perform a single model run:

```sh
cd packages/<connector>
docker-compose build run-model
docker-compose run run-model
```

The input will be taken from `<connector>/test/test-job.json` and output will go to `<connector>/output/data.json`.

### Upgrading a connector to use a newer version of the model

If the newer version of the model is already published as a Docker image (this can usually be found in GitHub Packages on the model repository or on this repository), then update the model version in the `.env` file and test using Docker as described above.

If the newer version of the model is not yet published as a Docker image, then you may wish to test against a local checkout of the model code, before working with the model team to obtain a published Docker image.
Read the next section for instructions on testing with a local checkout of the model.

### Running a connector using a local checkout of the model

To build and run one of the connectors on the local filesystem, outside Docker:

1. Ensure there is a copy of the model you want to build checked out locally.
1. `cd packages/<connector>`
1. Bootstrap the connector

    ```sh
    make bootstrap
    ```

    The first time you run, you will be instructed to set an environment variable pointing to your local checkout of the model (different for each connector). After setting it, re-run `make bootstrap` to build the model code.
1. Compile the TypeScript in one of the project directories:

    ```sh
    make build
    ```

    This will populate the `dist` folder with JavaScript files.
1. Run the tests as described earlier.
1. Run the model using the script `packages/<connector>/bin/run-model`. The model may ask for additional environment variables to be set.

### Publishing a package (maintainers only)

GitHub Actions will build, test, and publish a package whenever changes are committed to this repository.

To build and publish a numbered version of a package, create a Git tag of the form `package/vmajor.minor.patch`, for example `model-runner/v1.2.3`, and push it to the repository.

## Questions, comments, and where to find us

- Found a bug? [Raise an issue!](https://github.com/covid-modeling/model-runner/issues)
- Have a question? [Send an email!](mailto:covid-modeling+opensource@github.com)
- Want to contribue? [Raise a pull request!](https://github.com/covid-modeling/model-runner/pulls)

## Contributing

We welcome contributions to this project from the community. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT license. See [LICENSE](LICENSE).
