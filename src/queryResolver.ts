import { Message } from 'discord.js'
import { Pool } from 'threads'
import { VideoMetadataResult } from 'yt-search'
import { ObservablePlaylist } from './observablePlaylist'

export namespace QueryResolver {
  export const resolve = async ({ message, pool }: ParseQueryArgs) => {
    return await pool.queue(async worker => {
      const query = message.content.split('/play ')[1]
      const res = await worker.fetchInfo(query)
      const info = JSON.parse(res) as VideoMetadataResult
      if (info) {
        const newItem: Omit<ObservablePlaylist.Item, 'index'> = {
          link: info.url,
          name: `[${info.title} (${info.timestamp})](${info.url})`,
          message,
        }

        return newItem
      }
    })
  }

  export interface ParseQueryArgs {
    message: Message
    pool: Pool<any>
  }
}
