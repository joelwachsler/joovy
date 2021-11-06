import { DiscordAPIError } from 'discord.js'
import winston from 'winston'
import { Environment } from './environment'

const initLogger = () => {
  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        )
      }),
    ]
  })
}

const customErrorMessages = new Map<number, string>()
customErrorMessages.set(50013, `Couldn't remove reactions, does the bot have the 'Manage Messages' permission?`)

export const customErrorHandling = (env: Environment, e: any) => {
  const errorAsString = JSON.stringify(e)
  logger.error(errorAsString)

  if (e instanceof DiscordAPIError) {
    const customErrorMessage = customErrorMessages.get(e.code)

    if (customErrorMessage) {
      env.sendMessage.next(customErrorMessage)
    } else {
      env.sendMessage.next(`An error has occurred: ${e.message}`)
    }
  } else {
    env.sendMessage.next(`An unknown error has occurred: ${errorAsString}`)
  }
}

export const logger = initLogger()
