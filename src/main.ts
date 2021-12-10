import { Client, Intents, Message } from 'discord.js'
import { fromEvent, map, Observable } from 'rxjs'
import { Config } from './config'
import { Environment } from './Environment'
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
  })

  const msgEvent$ = fromEvent(client, 'messageCreate') as Observable<Message>
  handleMessage(msgEvent$.pipe(Environment.from))
    .subscribe(result => {
      logger.info(`${result.message.content} by ${result.message.author} has been handled with result: ${result}!`)
    })

  client.login(Config.init().token)
  logger.info('Done creating client!')

}

if (require.main === module) {
  main()
}
