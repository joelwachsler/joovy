import { Client } from 'discord.js'
import { Pool, spawn, Worker } from 'threads'
import { initConfig } from './config'
import { handleMessage } from './connectionHandler'
import { logger } from './logger'

const main = async () => {
  logger.info('Initializing pool...')
  const pool = Pool(() => spawn(new Worker('./workers/worker.ts')), 1)
  logger.info('Done initializing pool!')

  const config = initConfig()

  logger.info('Creating client...')
  const client = new Client()

  client.on('ready', () => {
    logger.info('Client is ready!')
  })

  client.on('message', async message => {
    logger.info(`Got a new mesage: "${message}"`)
    await handleMessage(message, pool)
  })

  client.login(config.token)
  logger.info('Done creating client!')
}

if (require.main === module) {
  main()
}
