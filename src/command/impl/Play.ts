import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'
import { TrackUtil } from '../TrackUtil'

export class Play implements Command {
  argument = Command.ArgParser.create('play')
    .withArg('url', arg => arg.or('query'))
  helpText = 'Play a track or queue it if a track is already playing.'

  constructor(private env: Environment, private trackUtil: TrackUtil) {}

  async handleMessage(message: Message) {
    const track = await this.trackUtil.addTrackToQueue(message)
    if (track) {
      this.env.addTrackToQueue.next(track)
    }
  }
}