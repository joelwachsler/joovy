import { from, Observable } from 'rxjs'
import { Pool, spawn, Worker } from 'threads'
import { VideoMetadataResult } from 'yt-search'
import { logger } from '../../logger'
import { ObservablePlaylist } from '../../observablePlaylist'
import { YtQuery } from '../YtQuery'

class QueryPool {
  private _pool: Pool<any> | undefined

  get pool() {
    if (!this._pool) {
      logger.info('Initializating pool...')
      this._pool = Pool(() => spawn(new Worker('./workers/worker.ts')), 1)
      logger.info('Done initializating pool!')
    }

    return this._pool
  }
}

const queryPool = new QueryPool()

export const runQueryReal = ({ message }: YtQuery.ParseQueryArgs): Observable<Omit<ObservablePlaylist.Track, "index"> | undefined> => {
  return from(queryPool.pool.queue(async worker => {
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
  }))
}