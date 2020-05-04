# Model Execution Architecture

## Running a model

### Execution flow

![Model Runner OSS Flow](images/model-runner-flow.png)

<details>
  <summary>Sequence Diagram Source</summary>

```mermaid
sequenceDiagram
  participant Web
  participant GitHub
  participant Runner
  participant DockerRegistry
  participant dockerd
  participant Filesystem
  participant BlobStorage
  Web->>GitHub: Dispatch model params
  GitHub-->>Web: OK
  GitHub->>+Runner: Repo Dispatch Event
  Runner->>Web: Execution start call back with version info
  Web-->>Runner: OK or Cancel
  Runner->>DockerRegistry: Request model's docker image
  DockerRegistry->>Runner: Docker image
  Runner->>dockerd: Execute container with mounts
  Runner->>Filesystem: Tee STDOUT/STDERR to a log file?
  dockerd->>Runner: Exit code
  Runner->>Filesystem: Scan input/output dirs or load list from JSON
  Runner->>Filesystem: Create export zip file
  Runner->>BlobStorage: Store results
  BlobStorage-->>Runner: OK
  Runner->>Web: Run complete
  Web-->>Runner: OK
  Runner->>Filesystem: Cleanup
  Runner->>-GitHub: Run complete
```

</details>

### API

The current API takes the form of a JSON input and output schema that is used to pass data from the web application to the model runner, and subsequently the models themselves. Its current incarnation lives in [`packages/api`](packages/api).

### Control Plane

A control plane is a GitHub repository that houses the workflow and other associated files needed to run the models. It may also have custom runner registered in order to provide more model specific hardware.

- An Actions workflow in control-plane repo executes model runner with input from the [repository dispatch event](https://help.github.com/en/actions/reference/events-that-trigger-workflows#external-events-repository_dispatch).
- The workflow matrixs out the list of models to execute into individual jobs that call the model runner.

### Model Runner

The model runner is a thin bit of wrapper code who's primary responsibility is communicating execution state to the frontend via a callback URL that is provided as part of the input.

Responsibilities:

- Communicating state to the frontend.
- Executing a [very particular](adding-models.md#docker-image) kind of Docker image/container.
- Input validation.
- Minimal generic output processing (i.e. export zip)
- Uploading artifacts to storage.

## Connectors

Connectors provide the glue code, needed for executing a specific model in this system. They need to do a transformation from our standard input format into the inputs that the model expects, either in configuration files on via the CLI. This code is also be responsible for the actual execution of the model itself. Finally, it must transform the output of the execution into the standard output format that we expect.

This code is managed independently of the model runner, either by the modeling team, or the open source community. It should wrap the published model artifact (Docker image or otherwise), and produce a Docker image matching a [very specific format](adding-models.md#docker-image), that can be executed directly.
