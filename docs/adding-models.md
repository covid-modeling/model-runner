# COVID Modelling Backend: Adding New Models

To add a new model, please follow the instructions below. You may use the existing connectors in this repo as a starting point.

1. Create a new directory/module in this repo for your [connector](architecture.md#connector).
1. Create any connector code that is required to transform from the [common input format](/packages/api/src/model-input.ts) into the input that your model accepts, and to transform your model's output into the [common output format](/packages/api/src/model-output.ts).
    - This can be omitted if your model executable already accepts inputs and outputs following the above standard schemas.
    - Several existing connectors are written in TypeScript. These will give you an idea of how to write your own, but you do not need to use the same language.

1. Create a Docker image with both the model code, and your connector code. [See the Docker Image section for more details](#docker-image)
1. Ensure that all the input files used when executing the model and all of the files that are output are copied into the appropriate input/output folders.
1. Add [Actions workflows](../.github/workflows) to build and publish your Docker image to the package registry.
1. If your model requires additional data, make sure it is included in your image.

## Docker Image

- Connector logs are sent to STDOUT.
- Returns a 0 or non-zero status code when completed. Non-zero is treated as a failure.
- No arguments required when executing the container.
  - `ENTRYPOINT` or `CMD` are specified in such a way that the container can be executed with no special arguments or other knowledge.
- All input data is copied to or stored in `/data/input` (this will be volume mounted into the container).
- All output data is copied to or stored in `/data/output` (this will be volume mounted into the container).
- All logs are copied to or stored in `/data/log` (this will be volume mounted into the container).

### Input

A file with all of the required input information will be mounted into the container as `/data/input/inputFile.json`. This file will contain JSON that satisfies the generalized `ModelInput` schema in [this file](/model-runner/src/api/index.ts).

### Output

Your image is expected to create a file: `/data/output/data.json` when it runs on the input. This file should contain JSON that satisfies the generalized `ModelOutput` schema in [this file](/model-runner/src/api/index.ts).
