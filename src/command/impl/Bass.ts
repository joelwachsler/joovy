import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'

export class Bass implements Command {
  command = '/bass level'
  helpText = 'Set the bass level of the current and the following songs.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/bass')) {
      return false
    }

    this.env.setBassLevel.next(Number(message.content.split(' ')[1]))

    return true
  }
}
