import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'

export class Seek implements Command {
  argument = Command.ArgParser.create('seek')
    .withArg('seconds', arg => arg.or('minutes:seconds'))
  helpText = 'Seek current playing song to the provided time.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message) {
    const seek = message.content.split('/seek ')[1]
    if (seek) {
      const splitSeek = seek.split(':')
      if (splitSeek.length > 1) {
        const minutes = Number(splitSeek[0] ?? 0)
        const seconds = Number(splitSeek[1] ?? 0)
        this.env.seek.next(minutes * 60 + seconds)
      } else {
        this.env.seek.next(Number(seek ?? 0))
      }
    }
  }
}
