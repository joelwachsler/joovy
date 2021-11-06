import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'

export class Skip implements Command {
  argument = Command.ArgParser.create('skip')
  helpText = 'Skip the current track.'

  constructor(private env: Environment) {}

  async handleMessage(_: Message) {
    this.env.nextTrackInPlaylist.next(null)
  }
}
