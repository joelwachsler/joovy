import { Observable } from 'rxjs'
import JEvent, { ResultEntry } from '../../jevent/JEvent'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  handleMessage(event: JEvent): Observable<ResultEntry> {
    // return event.withResult({}, event.sendMessage(event: 'Bye!'))
    return event.sendMessage(event, 'Bye!')
  }
}
