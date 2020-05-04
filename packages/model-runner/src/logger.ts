import * as pino from 'pino'

export const logger = pino({
  name: 'model-runner',
  level: 'info',
})
