import { concatMap, Observable } from 'rxjs'
import JEvent from '../../jevent/JEvent'
import { Result } from '../../jevent/Result'
import { getPlaylist } from '../../playlist/Playlist'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class RemoveLatests implements Command {
  argument = ArgParser.create('removelatest')
  helpText = 'Removes the last added track.'

  handleMessage(event: JEvent): Observable<Result> {
    return getPlaylist(event).pipe(
      concatMap(playlist => playlist.remove(playlist.queueLength - 1)),
      concatMap(removedTrack => event.sendMessage(`${removedTrack.name} has been removed.`)),
    )
  }
}
