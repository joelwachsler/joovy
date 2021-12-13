import { concat, mergeMapTo, Observable } from 'rxjs'
import JEvent, { ResultEntry } from '../../jevent/JEvent'
import { disconnectPlayer, removePlayerFromStore } from '../../player/Player'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  handleMessage(event: JEvent): Observable<ResultEntry> {
    const disconnect$ = disconnectPlayer(event)
      .pipe(mergeMapTo(event.result({ player: 'disconnected' })))

    const remove$ = removePlayerFromStore(event)
      .pipe(mergeMapTo(event.result({ player: 'removed' })))

    return concat(
      disconnect$,
      remove$,
      event.sendMessage('Bye!'),
    )
  }
}
