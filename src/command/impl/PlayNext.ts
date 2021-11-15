import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'
import { TrackUtil } from '../TrackUtil'

export class PlayNext implements Command {
  argument = Command.ArgParser.create('playnext')
    .withArg('url', arg => arg.or('query'))
  helpText = 'Skips the queue and adds the track as the next song.'

  constructor(private env: Environment, private trackUtil: TrackUtil) {}

  handleMessage(message: Message) {
    this.trackUtil.addTrackToQueue(message)
      .forEach(track => this.env.addNextTrackToQueue.next(track))
  }
}