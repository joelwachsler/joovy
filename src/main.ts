import { Client, Message } from 'discord.js'
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
  const client = new Client()

  client.on('ready', () => {
    logger.info('Client is ready!')
  })

  const msgEvent = fromEvent(client, 'message')
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
