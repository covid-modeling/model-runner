FROM node:buster-slim AS build

# Install lerna for project building
RUN npm install -g lerna

WORKDIR /runner

COPY package.json package-lock.json lerna.json ./
COPY packages/api ./packages/api/
COPY packages/model-runner ./packages/model-runner/

RUN lerna bootstrap
RUN lerna run build

ENV MODEL_RUNNER_LOG_DIR /data/log
ENV MODEL_INPUT_DIR /data/input
ENV MODEL_OUTPUT_DIR /data/output

####################################################################
# Do this here so that we don't have to run the tests when bulding a release.
FROM build AS release

ENTRYPOINT ["/runner/packages/model-runner/bin/run-model"]

####################################################################
FROM build AS test

RUN lerna run test
# FIXME: uncomment this when there are some actual tests
# RUN lerna run integration-test

####################################################################
# Use release as the default
FROM release
