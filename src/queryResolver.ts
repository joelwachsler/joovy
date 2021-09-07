import { Message } from 'discord.js'
import { Pool } from 'threads'
import { VideoMetadataResult } from 'yt-search'
import { ObservablePlaylist } from './observablePlaylist'

export namespace QueryResolver {
  export const resolve = async ({ message, pool }: ParseQueryArgs) => {
    return await pool.queue(async worker => {
      const query = message.content.split(' ').splice(1).join(' ')
      const res = await worker.fetchInfo(query)
      const info = JSON.parse(res) as VideoMetadataResult
      if (info) {
        const newTrack: Omit<ObservablePlaylist.Track, 'index'> = {
          link: info.url,
          name: `[${info.title} (${info.timestamp})](${info.url}) [<@${message.author.id}>]`,
          message,
        }

        return newTrack
      }
    })
  }

  export interface ParseQueryArgs {
    message: Message
    pool: Pool<any>
  }
}
