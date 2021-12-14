import { merge, mergeMap, Observable, of } from 'rxjs'
import JEvent, { ResultEntry } from '../../jevent/JEvent'
import { JMessage } from '../../JMessage'
import { Track } from '../../player/Player'
import { getOrCreatePlaylist } from '../../playlist/Playlist'
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

    return parseTrack(event.message)
      .pipe(
        mergeMap(track => {
          return getOrCreatePlaylist(event)
            .pipe(mergeMap(({ playlist$, results$ }) => {
              const addToPlaylist$ = playlist$
                .pipe(mergeMap(playlist => merge(
                  of(playlist),
                  playlist.item.add(event, track),
                )))


              // return merge(addToPlaylist$, results$)
              return merge(results$, addToPlaylist$)
            }))
        }),
      )
  }
}
