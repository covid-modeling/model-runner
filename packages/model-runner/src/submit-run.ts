import { readFileSync } from 'fs'
import * as https from 'https'
import * as pino from 'pino'

const logger = pino()

function main() {
  if (process.argv.length !== 4) return usage()

  const credsFilename = process.argv[2]
  if (!credsFilename) return usage()
  const creds = JSON.parse(readFileSync(credsFilename, 'utf8'))

  const inputFilename = process.argv[3]
  if (!inputFilename) return usage()
  const job = JSON.parse(readFileSync(inputFilename, 'utf8'))

  submitJob(creds, job)
}

/*
curl -X POST \
  https://api.github.com/repos/covid-modeling/prod-covid19-control-plane/dispatches \
  -H 'accept: application/vnd.github.everest-preview+json' \
  -H 'authorization: token $TOKEN' \
  -d '{
  "event_type": "run_simulation",
  "client_payload": {
    "test_key_name":  "Some Value here"
  }
}'
 */
function submitJob(creds, job) {
  const payload = {
    event_type: 'run-simulation',
    client_payload: job,
  }

  const data = JSON.stringify(payload)
  const options = {
    hostname: 'api.github.com',
    port: 443,
    headers: {
      'User-Agent': 'covid-modeling',
      Accept: 'application/vnd.github.everest-preview+json',
      Authorization: `token ${creds.token}`,
      'Content-Length': data.length,
    },
    method: 'POST',
    path: '/repos/covid-modeling/dev-covid19-control-plane/dispatches',
  }

  logger.info(data)

  const req = https.request(options, res => {
    logger.info(`statusCode: ${res.statusCode}`)
    res.on('data', d => {
      process.stdout.write(d)
    })
  })

  req.on('error', error => {
    logger.error(error)
  })

  req.write(data)
  req.end()
}

function usage() {
  console.log(
    `
Usage:

    submit-run <credentials-file> <input-file>

        Manually submit a single model run with the given input file to Actions. Prints the status code, and body of the HTTP response.

    `.trim()
  )
  process.exit(1)
}

main()
