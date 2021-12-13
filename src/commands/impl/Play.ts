import { concat, defaultIfEmpty, map, mergeAll, mergeMap, Observable, of } from 'rxjs'
import JEvent, { ResultEntry } from '../../jevent/JEvent'
import { JMessage } from '../../JMessage'
import { createPlayer, getPlayer, Track } from '../../player/Player'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Play implements Command {
  argument = ArgParser.create('play')
    .withArg('url', arg => arg.or('query'))
  helpText = 'Play a track or queue it if a track is already playing.'

  handleMessage(event: JEvent): Observable<ResultEntry> {
    const parseTrack = (message: JMessage): Observable<Track> => {
      return of({
        name: message.content,
        link: message.content.split(' ').splice(1).join(' '),
      })
    }

    const playerResult$ = getPlayer(event).pipe(
      map(player => event.complexResult({ item: player, result: { player: 'found' } })),
      defaultIfEmpty(createPlayer(event).pipe(
        mergeMap(player => event.complexResult({ item: player, result: { player: 'created' } })),
      )),
      mergeAll(),
    )

    const playTrack = (track: Track): Observable<ResultEntry> => {
      return playerResult$.pipe(mergeMap(playerResult => {
        const play$ = playerResult.item.play(track)
          .pipe(map(() => playerResult))
        const success$ = event.result({ playing: track })

        return concat(play$, success$)
      }))
    }

    return parseTrack(event.message)
      .pipe(mergeMap(track => playTrack(track)))
  }
}
