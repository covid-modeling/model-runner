ARG MC19_VERSION=latest
# This image is based on https://github.com/arnoudbuzing/wolfram-engine-docker.
FROM docker.pkg.github.com/covid-modeling/model-runner/mc19:${MC19_VERSION} AS build

# The model repo code in the image is at this location,
# which is used when resolving relative paths.
ENV MODEL_REPO_ROOT /root/Github/covidmodel
WORKDIR /connector
COPY connector.wl .
COPY bin/ ./bin/

ENV MODEL_INPUT_DIR /data/input
ENV MODEL_OUTPUT_DIR /data/output

####################################################################
# Do this here so that we don't have to run the tests when building a release.
FROM build AS release

ENTRYPOINT ["/connector/bin/run-model", "/data/input/inputFile.json", "/data/output/data.json"]

####################################################################
FROM build AS test
# No tests yet.

####################################################################
# Use release as the default
FROM release
