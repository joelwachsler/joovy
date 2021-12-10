import { Observable, of } from 'rxjs';
import { Event } from '../Event';

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
   * Wille be called if the message sent matches the one defined in argument.
   */
  handleMessage(event: Event): Observable<EventWithResult>
}

export type EventWithResult = { event: Event, result?: any }

class ArgParser {
  private constructor(public command: string, private args: string[]) { }

  is(potentialCmd: string) {
    return potentialCmd.startsWith(this.command)
  }

  get help() {
    return `${this.command} ${this.args.join(' ')}`
  }

  withArg(arg: string, builder?: (arg: ArgBuilder) => ArgBuilder) {
    let argBuilder = ArgBuilder.create(arg)
    if (builder) {
      argBuilder = builder(argBuilder)
    }
    this.args.push(argBuilder.build())
    return this
  }

  withOptionalArg(arg: string, builder?: (arg: ArgBuilder) => ArgBuilder) {
    let argBuilder = ArgBuilder.create(arg)
    if (builder) {
      argBuilder = builder(argBuilder)
    }
    this.args.push(`[${argBuilder.build}]`)
    return this
  }

  static create(command: string) {
    return new ArgParser(`/${command}`, [])
  }
}

class ArgBuilder {
  private constructor(private args: string[]) { }

  or(arg: string) {
    this.args.push(arg)
    return this
  }

  build() {
    return this.args.join(' | ')
  }

  static create(arg: string) {
    return new ArgBuilder([arg])
  }
}

export namespace Command {
  class Play implements Command {
    argument = ArgParser.create('play')
      .withArg('url', arg => arg.or('query'))

    helpText = 'Play a track or queue it if a track is already playing.'

    handleMessage(event: Event): Observable<EventWithResult> {
      return of({
        event,
        result: {
          player: {
            joined: 'testing'
          }
        }
      })
    }
  }

  class Help implements Command {
    argument = ArgParser.create('help')

    helpText = 'Print this message.'

    handleMessage(event: Event): Observable<EventWithResult> {
      throw new Error('Method not implemented.')
    }
  }

  const cmds = [
    new Play(),
  ]

  const help = new Help()

  export const handle = (event: Event): Observable<EventWithResult> => {
    for (const cmd of cmds) {
      if (cmd.argument.is(event.message.content)) {
        return cmd.handleMessage(event)
      }
    }

    return help.handleMessage(event)
  }
}
