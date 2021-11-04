import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'

export class Disconnect implements Command.Command {
  command = '/disconnect'
  helpText = 'Disconnects the bot from the current channel.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/disconnect')) {
      return false
    }

    this.env.disconnect.next(null)

    return true
  }
}
