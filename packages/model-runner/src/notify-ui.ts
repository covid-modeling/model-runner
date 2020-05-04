import * as https from 'https'
import { RunOutput } from '@covid-modeling/api'
import { logger } from './logger'

export async function notifyUI(
  url,
  sharedKey,
  runId: number | string,
  payload: RunOutput
): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload)
    const fullUrl = `${url}/api/simulations/${runId}`

    const options = {
      method: 'POST',
      headers: {
        'User-Agent': 'covid-modelling',
        Authorization: `Bearer ${sharedKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    }

    logger.info(data, 'sending a POST to %s', fullUrl)

    const req = https.request(fullUrl, options, res => {
      logger.info('notifyUI status: %s', res.statusCode)

      if (res.statusCode < 200 || res.statusCode >= 300) {
        logger.error('Unexpected API status: %d', res.statusCode)
        reject(new Error(`Unexpected API status: ${res.statusCode}`))
        return
      }

      resolve()
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}
