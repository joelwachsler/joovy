import { BehaviorSubject, concat, concatMap, concatMapTo, defaultIfEmpty, defer, map, merge, mergeAll, mergeMap, mergeMapTo, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs'
import JEvent from '../jevent/JEvent'
import { Result } from '../jevent/Result'
import Player, { Track } from '../player/Player'

export class Playlist {
  private _queue = new Subject<Track>()
  private _cancelled = new Subject<void>()
  private _currentQueue = new BehaviorSubject<Track[]>([])
  private _currentTrack = new BehaviorSubject<number>(0)
  private _skipTrack = new Subject<void>()

  constructor(private event: JEvent, private player: Player) { }

  isEndOfPlaylist() {
    return this._currentQueue.getValue().length <= this._currentTrack.getValue()
  }

  get results(): Observable<Result> {
    const player$ = this._queue.pipe(
      concatMap(track => {
        const sendMsg$ = this.event.sendMessage(`Now playing: ${track.name}`)
        const playTrack$ = this.player.play(track).pipe(concatMapTo(sendMsg$))

        const waitForPlayerIdle$ = this.player.idle(this._skipTrack, this.isEndOfPlaylist.bind(this)).pipe(
          concatMapTo(this.event.result({ player: 'idle' })),
          tap(() => this._currentTrack.next(this._currentTrack.getValue() + 1)),
        )

        return merge(waitForPlayerIdle$, playTrack$)
      }),
      takeUntil(this._cancelled),
    )

    const addedToQueue$ = this._queue.pipe(
      tap(track => {
        const queue = this._currentQueue.getValue()
        this._currentQueue.next([...queue, track])
      }),
      mergeMap(track => this.event.sendMessage(`${track.name} has been added to the queue`)),
    )

    const disconnectIfIdle$ = player$.pipe(
      switchMap(res => {
        const result = res.result
        if (typeof result === 'string' || result.player !== 'idle' || !this.isEndOfPlaylist()) {
          return of(res)
        }

        const disconnectWhenIdle$ = this.event.sendMessage('End of playlist, will disconnect in 5 minutes.').pipe(
          mergeMap(res => {
            return concat(
              of(res),
              of(undefined).pipe(
                this.event.factory.delay(playlistConfig.timeoutFrames),
                concatMap(() => {
                  return removePlaylist(this.event).pipe(
                    mergeMapTo(this.event.result({ player: 'disconnected because idle' })),
                  )
                }),
              ),
            )
          }),
        )

        return concat(of(res), disconnectWhenIdle$)
      }),
    )

    return merge(
      addedToQueue$,
      disconnectIfIdle$,
    )
  }

  get currentQueue() {
    return {
      currentTrack: this._currentTrack.getValue(),
      queue: this._currentQueue.getValue(),
    }
  }

  skipCurrentTrack() {
    return defer(() => {
      this._skipTrack.next()
      return of(undefined)
    })
  }

  add(event: JEvent, track: Track): Observable<Result> {
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

export const playlistConfig = {
  timeoutFrames: 5 * 60 * 1000,
}

type PlaylistResult = { playlist: Playlist, results$: Observable<Result> }

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
