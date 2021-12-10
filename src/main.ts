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
    .subscribe(event => {
      logger.info(`${event.message.content} by ${event.message.author} has been handled!`)
    })
  // msgEvent$
  //   .pipe(
  //     map(Environment.from),
  //     filter(({ message }) => !message.author.bot),
  //     filter(({ message }) => message.content.startsWith('/')),
  //   )
  //   .subscribe(msg => {
  //     logger.info(`Got a new message: ${msg}`)
  //   })

  // initMsgHandler(fromEvent(client, 'messageCreate') as Observable<Message>)

  client.login(Config.init().token)
  logger.info('Done creating client!')

}

if (require.main === module) {
  main()
}
