import { Observable } from 'rxjs'
import JEvent, { ResultEntry } from '../../jevent/JEvent'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  handleMessage(_: JEvent): Observable<ResultEntry> {
    throw Error('Not implemented')
    // const sendBye$ = event.sendMessage('Bye!')

    // const remove$ = removePlayerFromStore(event)
    //   .pipe(mergeMapTo(event.result({ player: 'removed' })))

    // return disconnectPlayer(event)
    //   .pipe(mergeMapTo(event.result({ player: 'disconnected' }, remove$, sendBye$)))
  }
}
