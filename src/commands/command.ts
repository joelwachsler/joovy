import { Observable } from 'rxjs'
import JEvent, { Result } from '../jevent/JEvent'
import ArgParser from './ArgParser'
import Disconnect from './impl/Disconnect'
import Help from './impl/Help'
import Play from './impl/Play'
import Queue from './impl/Queue'
import Skip from './impl/Skip'

export default interface Command {
  /**
   * Defines when the current command should be run, its arguments and a description of it.
   */
  argument: ArgParser

  /**
   * Describes what the command does.
   */
  helpText: string

  /**
   * Will be called if the message sent matches the one defined in argument.
   */
  handleMessage(event: JEvent): Observable<Result>
}

const cmds = [
  new Play(),
  new Disconnect(),
  new Queue(),
  new Skip(),
]

const help = new Help(cmds)

export const handle = (event: JEvent): Observable<Result> => {
  const content = event.message.content

  for (const cmd of cmds) {
    if (cmd.argument.is(content)) {
      return event.result(
        { commandCalled: cmd.argument.command },
        cmd.handleMessage(event),
      )
    }
  }

  return event.result(
    { invalidCommand: content },
    help.handleMessage(event),
  )
}
