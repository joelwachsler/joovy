import { Client, Intents, Message } from 'discord.js'
import { fromEvent, map, Observable } from 'rxjs'
import { initConfig } from './config'
import { initMsgHandler } from './connectionHandler'
import { logger } from './logger'

const main = async () => {
  const config = initConfig()
  logger.info('Creating client...')
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES],
  })

  client.once('ready', () => {
    logger.info('Client is ready!')
  })

  client.on('interactionCreate', msg => {
    logger.info('New interaction!')
    logger.info(msg)
  })

  initMsgHandler(fromEvent(client, 'messageCreate') as Observable<Message>)

  client.login(config.token)
  logger.info('Done creating client!')
}

if (require.main === module) {
  main()
}
