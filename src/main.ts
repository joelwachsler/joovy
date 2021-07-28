import { Client } from 'discord.js'
import { initConfig } from './config'
import { handleMessage } from './connectionHandler'
import { logger } from './logger'

const main = async () => {
  const config = initConfig()

  logger.info('Creating client...')
  const client = new Client()

  client.on('ready', () => {
    logger.info('Client is ready!')
  })

  client.on('message', async message => {
    logger.info(`Got a new mesage: "${message}"`)
    await handleMessage(message)
  })

  client.login(config.token)
  logger.info('Done creating client!')
}

if (require.main === module) {
  main()
}
