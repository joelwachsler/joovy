import { concat, mergeMap, Observable, of } from 'rxjs'
import JEvent, { Result } from '../../jevent/JEvent'
import { removePlaylist } from '../../playlist/Playlist'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  handleMessage(event: JEvent): Observable<Result> {
    return removePlaylist(event)
      .pipe(mergeMap(msg => concat(of(msg), event.sendMessage('Bye!'))))
  }
}
