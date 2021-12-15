import { concatMap, concatMapTo, defaultIfEmpty, defer, map, mapTo, mergeAll, mergeMap, Observable, of, Subject } from 'rxjs'
import JEvent, { ResultEntry } from '../jevent/JEvent'
import Player, { Track } from '../player/Player'

export class Playlist {
  private _queue = new Subject<Track>()
  private _output = new Subject<Observable<ResultEntry>>()

  constructor(private event: JEvent, private player: Player) {}

  get output(): Observable<ResultEntry> {
    return this._output.pipe(mergeAll())
  }

  get results() {
    return this._queue.pipe(
      concatMap(track => {
        const sendMsg$ = this.event.sendMessage(`Now playing: ${JSON.stringify(track)}`)
        const waitForPlayerToFinish = <T>(t: T) => this.player.idle().pipe(mapTo(t))

        return this.player.play(track).pipe(
          concatMapTo(sendMsg$),
          concatMap(waitForPlayerToFinish),
        )
      }),
    )
  }

  add(event: JEvent, track: Track): Observable<ResultEntry> {
    return defer(() => {
      this._queue.next(track)
      return event.sendMessage(`${JSON.stringify(track)} has been added to the queue`)
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
