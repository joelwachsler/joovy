import * as dotenv from 'dotenv'

export type Config = ReturnType<typeof initConfig>

export function initConfig() {
  // init config from .env
  dotenv.config()

  return {
    token: process.env.TOKEN ?? throwError('No token defined...'),
  }
}

const throwError = (error: string) => {
  throw Error(error)
}
