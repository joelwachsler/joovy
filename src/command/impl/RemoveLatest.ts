import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'

export class RemoveLatest implements Command {
  command = '/removelatest'
  helpText = 'Removes the last added track.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/removelatest')) {
      return false
    }

    this.env.removeLatestFromQueue.next(null)

    return true
  }
}
