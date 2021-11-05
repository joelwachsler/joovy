import { Message } from 'discord.js'
import { Pool } from 'threads'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'
import { TrackUtil } from './TrackUtil'

export class Play implements Command {
  command = '/play url | query'
  helpText = 'Play a track or queue it if a track is already playing.'

  private trackUtil: TrackUtil

  constructor(private env: Environment, pool: Pool<any>) {
    this.trackUtil = new TrackUtil(env, pool)
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/play')) {
      return false
    }

    const track = await this.trackUtil.addTrackToQueue(message)
    if (track) {
      this.env.addTrackToQueue.next(track)
    }

    return true
  }
}