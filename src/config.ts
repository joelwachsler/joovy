import * as dotenv from 'dotenv'

export type Config = ReturnType<typeof init>

const init = () => {
  // init config from .env
  dotenv.config()

  return {
    token: process.env.TOKEN ?? throwError('No token defined...'),
    applicationId: process.env.APPLICATION_ID ?? throwError('Application id is not defined...'),
    testGuildId: process.env.TEST_GUILD_ID,
    dbLocation: process.env.DB_LOCATION ?? './db',
  }
}

const throwError = (error: string) => {
  throw Error(error)
}

let config: Config

export default () => {
  if (!config) {
    config = init()
  }

  return config
}
