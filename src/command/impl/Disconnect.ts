import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command, ArgParser } from '../command'

export class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  constructor(private env: Environment) {}

  async handleMessage(_: Message) {
    this.env.disconnect.next(null)
  }
}
