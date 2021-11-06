import { Message } from 'discord.js'
import { Pool } from 'threads'
import { Environment } from '../../environment'
import { logger } from '../../logger'
import { ObservablePlaylist } from '../../observablePlaylist'
import { QueryResolver } from '../../queryResolver'

export class TrackUtil {

  constructor(private env: Environment, private pool: Pool<any>) {}

  async addTrackToQueue(message: Message): Promise<Omit<ObservablePlaylist.Track, "index"> | undefined> {
    try {
      const newTrack = await QueryResolver.resolve({ message, pool: this.pool })
      if (newTrack) {
        return newTrack
      } else {
        this.env.sendMessage.next(`Unable to find result for: ${message.content}`)
      }
    } catch (e) {
      logger.error(e)
      this.env.sendMessage.next(`Unable to add song to playlist: ${e}`)
    }
  }
}