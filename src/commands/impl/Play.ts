import { defaultIfEmpty, map, mergeMap, Observable, of } from 'rxjs'
import JEvent from '../../JEvent'
import logger from '../../logger'
import Player from '../../player/Player'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Play implements Command {
  argument = ArgParser.create('play')
    .withArg('url', arg => arg.or('query'))

  helpText = 'Play a track or queue it if a track is already playing.'

  getAudioPlayer(event: JEvent) {
    event.message.channelId
  }

  private getOrCreatePlayer(event: JEvent): Observable<Player> {
    const playerKey = 'player'
    return event.store.object.pipe(
      mergeMap(objectStore => {
        const createPlayer = (): Observable<Player> => {
          return event.factory.player.pipe(
            mergeMap(newPlayer => objectStore.put(playerKey, newPlayer)),
          )
        }

        return objectStore.get(playerKey).pipe(
          map(result => of(result as Player)),
          defaultIfEmpty(createPlayer()),
          mergeMap(p => p),
        )
      }),
    )
  }

  handleMessage(event: JEvent): Observable<JEvent> {
    return this.getOrCreatePlayer(event)
      .pipe(
        map(_ => {
          logger.info('called')
        }),
        map(() => event.withResult({
          player: {
            joined: 'testing',
          },
        })),
      )
  }
}
