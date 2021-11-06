import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command, ArgParser } from '../command'

export class Bass implements Command {
  argument = ArgParser.create('bass')
    .withArg('level')
  helpText = 'Set the bass level of the current and the following songs.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message) {
    this.env.setBassLevel.next(Number(message.content.split(' ')[1]))
  }
}
