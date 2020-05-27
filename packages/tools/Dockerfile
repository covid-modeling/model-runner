FROM node:buster-slim AS build

# Install lerna for project building
RUN npm install -g lerna

WORKDIR /runner

COPY package.json package-lock.json lerna.json ./
COPY packages/api ./packages/api/
COPY packages/model-runner ./packages/model-runner/
COPY packages/mrc-ide-covidsim ./packages/mrc-ide-covidsim/
COPY packages/tools ./packages/tools/

RUN lerna bootstrap
RUN lerna run build

####################################################################
# Do this here so that we don't have to run the tests when bulding a release.
FROM build AS release

####################################################################
FROM build AS test

## FIXME: Add tests.
# RUN lerna run test

####################################################################
# Use release as the default
FROM release
