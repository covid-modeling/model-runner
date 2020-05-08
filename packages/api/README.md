# `api` Package

The api shared between the model-runner, the web front end, and the model connectors.

## Publishing

To publish the `@covid-modeling/api` package:

1. Update the version of the api package in its `package.json` file.
1. Push this to origin, make sure it passes CI and makes its way to master.
1. Run the `script/publish-release` with the name of the new release in
   the form `api/vA.B.C`. This creates the tag and pushes it to the `origin`
   remote.
