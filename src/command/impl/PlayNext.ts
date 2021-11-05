import { Message } from 'discord.js'
import { Pool } from 'threads'
import { Environment } from '../../connectionHandler'
import { Command } from '../command'
import { TrackUtil } from './TrackUtil'

export class PlayNext implements Command {
  command = '/playnext url | query'
  helpText = 'Skips the queue and adds the track as the next song.'

  private trackUtil: TrackUtil

  constructor(private env: Environment, pool: Pool<any>) {
    this.trackUtil = new TrackUtil(env, pool)
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/playnext')) {
      return false
    }

    const track = await this.trackUtil.addTrackToQueue(message)
    if (track) {
      this.env.addNextTrackToQueue.next(track)
    }

    return true
  }
}