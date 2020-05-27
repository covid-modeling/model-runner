import * as pino from 'pino'

export const logger = pino({
  name: 'tools',
  level: 'info',
})
