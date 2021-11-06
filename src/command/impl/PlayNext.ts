import { Message } from 'discord.js'
import { Pool } from 'threads'
import { Environment } from '../../environment'
import { Command } from '../command'
import { TrackUtil } from './TrackUtil'

export class PlayNext implements Command {
  argument = Command.ArgParser.create('playnext')
    .withArg('url', arg => arg.or('query'))
  helpText = 'Skips the queue and adds the track as the next song.'

  private trackUtil: TrackUtil

  constructor(private env: Environment, pool: Pool<any>) {
    this.trackUtil = new TrackUtil(env, pool)
  }

  async handleMessage(message: Message) {
    const track = await this.trackUtil.addTrackToQueue(message)
    if (track) {
      this.env.addNextTrackToQueue.next(track)
    }
  }
}