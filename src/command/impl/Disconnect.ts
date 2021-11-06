import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'

export class Disconnect implements Command {
  argument = Command.ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  constructor(private env: Environment) {}

  async handleMessage(_: Message) {
    this.env.disconnect.next(null)
  }
}
