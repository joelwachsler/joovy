import { defaultIfEmpty, map, mapTo, mergeMap, Observable, of } from 'rxjs';
import { Event } from '../../Event';
import { Player } from '../../player/Player';
import { ArgParser } from '../ArgParser';
import { Command } from '../command';

export class Play implements Command {
  argument = ArgParser.create('play')
    .withArg('url', arg => arg.or('query'));

  helpText = 'Play a track or queue it if a track is already playing.';

  getAudioPlayer(event: Event) {
    event.message.channelId
  }

  private getOrCreatePlayer(event: Event): Observable<Player> {
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
      })
    )
  }

  handleMessage(event: Event): Observable<Event> {
    return this.getOrCreatePlayer(event)
      .pipe(
        map(player => {}),
        mapTo(event.withResult({
          player: {
            joined: 'testing',
          }
        }))
      )
  }
}
