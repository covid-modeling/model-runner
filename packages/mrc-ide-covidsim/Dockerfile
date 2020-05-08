# Default version if the variable is not set. The version in the .env file takes precedence.
ARG COVIDSIM_VER=master
FROM docker.pkg.github.com/mrc-ide/covid-sim/covidsim-us:${COVIDSIM_VER} AS covidsim

####################################################################
FROM node:buster-slim AS build

# Install lerna for project building
RUN npm install -g lerna

# SpatailSim Dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && apt-get clean -y \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy and unzip the imperial model data and executables
COPY --from=covidsim /data/input /model/input
COPY --from=covidsim /usr/bin/CovidSim /usr/bin/CovidSim
RUN gunzip /model/input/populations/*.gz \
    && rm -f /model/input/populations/*.gz

WORKDIR /connector

COPY package.json package-lock.json lerna.json ./
COPY packages/api ./packages/api/
COPY packages/mrc-ide-covidsim ./packages/mrc-ide-covidsim/

RUN lerna bootstrap
RUN lerna run build

ENV MODEL_RUNNER_BIN_DIR /usr/bin
ENV MODEL_RUNNER_LOG_DIR /data/log
ENV MODEL_DATA_DIR /model/input
ENV MODEL_INPUT_DIR /data/input
ENV MODEL_OUTPUT_DIR /data/output

####################################################################
# Do this here so that we don't have to run the tests when bulding a release.
FROM build AS release

ENTRYPOINT ["/connector/packages/mrc-ide-covidsim/bin/run-model"]

####################################################################
FROM build AS test

RUN lerna run test
RUN lerna run integration-test

####################################################################
# Use release as the default
FROM release
