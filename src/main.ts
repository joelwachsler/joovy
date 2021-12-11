import { Client, Intents, Message } from 'discord.js'
import { fromEvent, mergeMap, Observable } from 'rxjs'
import { Config } from './config'
import { Event } from './Event'
import { logger } from './logger'
import { handleMessage } from './messageHandler'

const main = async () => {
  logger.info('Creating client...')
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_VOICE_STATES
    ],
  })

  client.once('ready', () => {
    logger.info('Client is ready!')

    const msgEvent$ = fromEvent(client, 'messageCreate') as Observable<Message>
    handleMessage(msgEvent$.pipe(Event.from))
      .subscribe(event => {
        const result = event.result
        logger.info(`${event.message.content} by ${event.message.author} has been handled with result: ${result ? JSON.stringify(result) : result}!`)
      })
  })

  client.login(Config.init().token)
  logger.info('Done creating client!')
}

if (require.main === module) {
  main()
}
