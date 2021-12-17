import { concatMap, concatMapTo, defaultIfEmpty, defer, map, merge, mergeAll, mergeMap, mergeMapTo, Observable, of, Subject, takeUntil } from 'rxjs'
import JEvent, { ResultEntry } from '../jevent/JEvent'
import Player, { Track } from '../player/Player'

export class Playlist {
  private _queue = new Subject<Track>()
  private _cancelled = new Subject<void>()

  constructor(private event: JEvent, private player: Player) {}

  get results(): Observable<ResultEntry> {
    const q$ = this._queue.pipe(
      concatMap(track => {
        const sendMsg$ = this.event.sendMessage(`Now playing: ${JSON.stringify(track)}`)
        return merge(
          this.player.play(track).pipe(concatMapTo(sendMsg$)),
          this.player.idle().pipe(concatMapTo(this.event.result({ player: 'idle' }))),
        )
      }),
      takeUntil(this._cancelled),
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

  disconnect() {
    this._queue.complete()
    this.player.disconnect()
    this._cancelled.next()
  }
}

const PLAYLIST_KEY = 'playlist'

type PlaylistResult = { playlist: Playlist, results$: Observable<ResultEntry> }

const createPlaylist = (event: JEvent): Observable<PlaylistResult> => {
  const playlist$ = event.factory.player.pipe(map(player => new Playlist(event, player)))

  return playlist$.pipe(mergeMap(playlist => {
    return event.store.object.pipe(mergeMap(store => {
      return store.put(PLAYLIST_KEY, playlist).pipe(map(() => {
        return {
          playlist,
          results$: event.result({ playlist: 'created' }, playlist.results),
        }
      }))
    }))
  }))
}

export const getPlaylist = (event: JEvent) => {
  return event.store.object.pipe(
    mergeMap(store => store.get(PLAYLIST_KEY)),
    map(r => r as Playlist),
  )
}

export const removePlaylist = (event: JEvent) => {
  return getPlaylist(event).pipe(
    mergeMap(playlist => {
      playlist.disconnect()

      return event.store.object.pipe(mergeMap(store => store.remove(PLAYLIST_KEY)))
        .pipe(mergeMapTo(event.result({ playlist: 'disconnected' })))
    }),
  )
}

export const getOrCreatePlaylist = (event: JEvent): Observable<PlaylistResult> => {
  return getPlaylist(event).pipe(
    map(playlist => of({ playlist, results$: event.result({ playlist: 'found' }) })),
    defaultIfEmpty(createPlaylist(event)),
    mergeAll(),
  )
}
