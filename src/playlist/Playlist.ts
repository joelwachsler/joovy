import { BehaviorSubject, concatMap, concatMapTo, defaultIfEmpty, defer, map, merge, mergeAll, mergeMap, mergeMapTo, Observable, of, Subject, takeUntil, tap } from 'rxjs'
import JEvent, { ResultEntry } from '../jevent/JEvent'
import Player, { Track } from '../player/Player'

export class Playlist {
  private _queue = new Subject<Track>()
  private _cancelled = new Subject<void>()
  private _currentQueue = new BehaviorSubject<Track[]>([])
  private _currentTrack = new BehaviorSubject<number>(-1)

  constructor(private event: JEvent, private player: Player) {}

  get results(): Observable<ResultEntry> {
    const q$ = this._queue.pipe(
      concatMap(track => {
        const sendMsg$ = this.event.sendMessage(`Now playing: ${JSON.stringify(track)}`)
        const playTrack$ = this.player.play(track).pipe(
          tap(() => this._currentTrack.next(this._currentTrack.getValue() + 1)),
          concatMapTo(sendMsg$),
        )

        const waitForPlayerIdle$ = this.player.idle().pipe(concatMapTo(this.event.result({ player: 'idle' })))

        return merge(playTrack$, waitForPlayerIdle$)
      }),
      takeUntil(this._cancelled),
    )

    const q2$ = this._queue.pipe(
      tap(track => {
        const queue = this._currentQueue.getValue()
        this._currentQueue.next([...queue, track])
      }),
      mergeMap(track => this.event.sendMessage(`${JSON.stringify(track)} has been added to the queue`)),
    )

    return merge(
      q2$,
      q$,
    )
  }

  get currentQueue() {
    return {
      currentTrack: this._currentTrack.getValue(),
      queue: this._currentQueue.getValue(),
    }
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
