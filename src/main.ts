import { Client, Intents, Message } from 'discord.js'
import { fromEvent, map } from 'rxjs'
import { Pool, spawn, Worker } from 'threads'
import { initConfig } from './config'
import { initMsgHandler } from './connectionHandler'
import { logger } from './logger'

const main = async () => {
  logger.info('Initializing pool...')
  const pool = Pool(() => spawn(new Worker('./workers/worker.ts')), 1)
  logger.info('Done initializing pool!')

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

  const msgEvent = fromEvent(client, 'messageCreate')
    .pipe(map(message => ({ message: message as Message, pool })))
  initMsgHandler(msgEvent)

  client.login(config.token)
  logger.info('Done creating client!')
}

export interface MsgEvent {
  message: Message
  pool: Pool<any>
}

if (require.main === module) {
  main()
}
