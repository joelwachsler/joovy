import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'

export class Remove implements Command {
  command = '/remove fromIndex [toIndex]'
  helpText = 'Remove specified track(s).'

  constructor(private env: Environment) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/remove')) {
      return false
    }

    const removeCmd = message.content.split(' ')
    const from = Number(removeCmd[1])
    const to = Number(removeCmd[2] ?? from)
    this.env.removeFromQueue.next({ from, to })

    return true
  }
}
