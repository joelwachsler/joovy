import { Message } from 'discord.js'
import { catchError, from, map, Observable, of, switchMap } from 'rxjs'
import { Environment } from '../environment'
import { logger } from '../logger'
import { ObservablePlaylist } from '../observablePlaylist'
import { YtQuery } from '../ytquery/YtQuery'

export class TrackUtil {

  constructor(private env: Environment) {}

  addTrackToQueue(message: Message): Observable<Omit<ObservablePlaylist.Track, "index">> {
    return from(YtQuery.runQuery({ message }))
      .pipe(
        map(newTrack => {
          if (newTrack) {
            return newTrack
          } else {
            this.env.sendMessage.next(`Unable to find result for: ${message.content}`)
          }
        }),
        switchMap(track => track ? [track] : []),
        catchError(e => {
          logger.error(e)
          this.env.sendMessage.next(`Unable to add song to playlist: ${e}`)
          return of()
        })
      )
  }
}