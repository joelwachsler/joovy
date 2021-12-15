import { concatMap, concatMapTo, defaultIfEmpty, defer, map, merge, mergeAll, mergeMap, Observable, of, Subject } from 'rxjs'
import JEvent, { ResultEntry } from '../jevent/JEvent'
import Player, { Track } from '../player/Player'

export class Playlist {
  private _queue = new Subject<Track>()

  constructor(private event: JEvent, private player: Player) {}

  get results() {
    const q$ = this._queue.pipe(
      concatMap(track => {
        const sendMsg$ = this.event.sendMessage(`Now playing: ${JSON.stringify(track)}`)
        return merge(
          this.player.play(track).pipe(concatMapTo(sendMsg$)),
          this.player.idle().pipe(concatMapTo(this.event.result({ player: 'idle' }))),
        )
      }),
    )

    const q2$ = this._queue.pipe(mergeMap(track => this.event.sendMessage(`${JSON.stringify(track)} has been added to the queue`)))

    return merge(
      q2$,
      q$,
    )
  }

  add(event: JEvent, track: Track): Observable<ResultEntry> {
    return defer(() => {
      this._queue.next(track)
      return event.empty()
    })
  }
}

const PLAYLIST_KEY = 'playlist'

type PlaylistResult = { playlist: Playlist, results$: Observable<ResultEntry> }

const createPlaylist = (event: JEvent): Observable<PlaylistResult> => {
  return event.factory.player.pipe(mergeMap(player => {
    return event.store.object.pipe(mergeMap(store => {
      const playlist = new Playlist(event, player)

      return store.put(PLAYLIST_KEY, playlist).pipe(map(() => {
        return {
          playlist,
          results$: event.result({ playlist: 'created' }, playlist.results),
        }
      }))
    }))
  }))
}

const getPlaylist = (event: JEvent) => {
  return event.store.object.pipe(
    mergeMap(store => store.get(PLAYLIST_KEY)),
    map(r => r as Playlist),
    map(playlist => of({ playlist, results$: event.result({ playlist: 'found' }) })),
  )
}

export const getOrCreatePlaylist = (event: JEvent): Observable<PlaylistResult> => {
  return getPlaylist(event).pipe(
    defaultIfEmpty(createPlaylist(event)),
    mergeAll(),
  )
}
