import { concat, concatMapTo, defaultIfEmpty, EMPTY, map, mapTo, mergeAll, mergeMap, Observable, of, Subject } from 'rxjs'
import JEvent, { ResultEntry } from '../jevent/JEvent'
import Player, { Track } from '../player/Player'

class Playlist {
  private queue = new Subject<Track>()
  results: Observable<ResultEntry>

  constructor(event: JEvent, player: Player) {
    this.results = this.queue.pipe(
      mergeMap(track => {
        const waitForTrackToFinish$ = concat(
          event.sendMessage(`Now playing: ${JSON.stringify(track)}`),
          player.idle().pipe(concatMapTo(event.result({ player: 'idle' }))),
        )

        return player.play(track).pipe(concatMapTo(waitForTrackToFinish$))
      }),
    )
  }

  add(event: JEvent, track: Track): Observable<ResultEntry> {
    return of(this.queue.next(track))
      .pipe(concatMapTo(event.sendMessage(`${JSON.stringify(track)} has been added to the queue`)))
  }
}

const PLAYLIST_KEY = 'playlist'

type PlaylistResult = { playlist$: Observable<ResultEntry<Playlist>>, results$: Observable<ResultEntry> }

export const getOrCreatePlaylist = (event: JEvent): Observable<PlaylistResult> => {
  const createPlaylist$: Observable<PlaylistResult> = event.factory.player.pipe(
    mergeMap(player => {
      const playlist = new Playlist(event, player)
      return event.store.object.pipe(
        mergeMap(store => store.put(PLAYLIST_KEY, playlist)),
        mapTo(playlist),
        map(playlist => ({
          playlist$: event.complexResult({ item: playlist, result: { playlist: 'created' } }),
          results$: playlist.results,
        })),
      )
    }),
  )

  return event.store.object.pipe(
    mergeMap(store => store.get(PLAYLIST_KEY)),
    map(r => r as Playlist),
    map(playlist => of({ playlist$: event.complexResult({ item: playlist, result: { playlist: 'found' } }), results$: EMPTY })),
    defaultIfEmpty(createPlaylist$),
    mergeAll(),
  )
}
