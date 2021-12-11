import { Observable } from 'rxjs';
import { Event } from '../Event';
import { ArgParser } from './ArgParser';
import { Help } from './impl/Help';
import { Play } from './impl/Play';

export interface Command {
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
  handleMessage(event: Event): Observable<Event>
}

export namespace Command {
  const cmds = [
    new Play(),
  ]

  const help = new Help()

  export const handle = (event: Event): Observable<Event> => {
    for (const cmd of cmds) {
      if (cmd.argument.is(event.message.content)) {
        return cmd.handleMessage(event)
      }
    }

    return help.handleMessage(event)
  }
}
