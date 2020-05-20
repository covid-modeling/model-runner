# Default version if the variable is not set. The version in the .env file takes precedence.
ARG BASEL_VERSION=master
FROM docker.pkg.github.com/covid-modeling/model-runner/basel:${BASEL_VERSION} AS build

# Install lerna for project building
RUN npm install -g lerna

# Copy the Basel model data.
RUN mkdir -p /model/input \
  && cp /runner/src/assets/data/scenarios.json /model/input/scenarios.json

WORKDIR /connector

COPY package.json package-lock.json lerna.json ./
COPY packages/api ./packages/api/
COPY packages/neherlab-covid-19-scenarios ./packages/neherlab-covid-19-scenarios/

RUN lerna bootstrap
RUN lerna run build

# Tell the run-basel-model wrapper executable where to find the model code.
ENV MODEL_REPO_ROOT /runner
# The run-basel-model wrapper executable is stored here.
ENV MODEL_RUNNER_BIN_DIR /connector/packages/neherlab-covid-19-scenarios/bin
ENV MODEL_RUNNER_LOG_DIR /data/log
ENV MODEL_DATA_DIR /model/input
ENV MODEL_INPUT_DIR /data/input
ENV MODEL_OUTPUT_DIR /data/output

####################################################################
# Do this here so that we don't have to run the tests when bulding a release.
FROM build AS release

ENTRYPOINT ["/connector/packages/neherlab-covid-19-scenarios/bin/run-model"]

####################################################################
FROM build AS test

RUN lerna run test
RUN lerna run integration-test

####################################################################
# Use release as the default
FROM release
