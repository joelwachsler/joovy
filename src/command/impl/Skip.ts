import { Message } from 'discord.js'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'

export class Skip implements Command.Command {
  command = '/skip'
  helpText = 'Skip the current track.'

  constructor(private env: Environment) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/skip')) {
      return false
    }

    this.env.nextTrackInPlaylist.next(null)

    return true
  }
}
