import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'

export class Queue implements Command.Command {
  command = '/queue'
  helpText = 'Print the current queue.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/queue')) {
      return false
    }

    this.env.printQueueRequest.next(null)

    return true
  }
}
