# Development

Ref: [README](../README.md#building)

## Submitting A Job to the Actions Runners

You can use the `bin/submit-run` script to kick of a job using the full model-running pipeline on Github Actions. It will send a [repository_dispatch](https://help.github.com/en/actions/reference/events-that-trigger-workflows#external-events-repository_dispatch) event to the GitHub API using the [Personal Access Token (PAT)](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) that you provide. **Note** That the PAT that you use must have `admin:repo_hook` enabled.

The expected format of the token file is:

```json
{
  "token": "lkjsjf"
}
```

Example:

```sh
./bin/submit-run token.json jobInput.json
```
