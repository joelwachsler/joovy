import { Message } from 'discord.js'
import { Observable } from 'rxjs'
import { Environment } from '../environment'
import { Bass } from './impl/Bass'
import { Disconnect } from './impl/Disconnect'
import { Help } from './impl/Help'
import { Play } from './impl/Play'
import { PlayNext } from './impl/PlayNext'
import { Queue } from './impl/Queue'
import { Remove } from './impl/Remove'
import { RemoveLatest } from './impl/RemoveLatest'
import { Seek } from './impl/Seek'
import { Skip } from './impl/Skip'
import { TrackUtil } from './TrackUtil'

export interface Command {
  /**
   * Defines when the current command should be run, its arguments and a description of it.
   */
  argument: Command.ArgParser

  /**
   * Describe what the command does.
   */
  helpText: string

  /**
   * Will be called if the message sent starts with the one defined in command.
   */
  handleMessage(message: Message): void
}

export namespace Command {
  export const init = (env: Environment, message$: Observable<Message>) => {
    const trackUtil = new TrackUtil(env)

    const cmds = [
      new PlayNext(env, trackUtil),
      new Play(env, trackUtil),
      new Seek(env),
      new Skip(env),
      new Bass(env),
      new RemoveLatest(env),
      new Remove(env),
      new Queue(env),
      new Disconnect(env),
    ]

    const help = new Help(cmds)
    const cmdsWithHelp = [...cmds, help]

    return message$.forEach(message => {
      const { content } = message
      for (const cmd of cmdsWithHelp) {
        if (cmd.argument.is(content)) {
          cmd.handleMessage(message)
          return
        }
      }
      env.sendMessage.next(`Unknown command: \`${message.content}\`, type \`${help.argument.command}\` for available commands.`)
    })
  }

  export class ArgParser {

    private constructor(public command: string, private args: string[]) {}

    is(potentialCmd: string) {
      return potentialCmd.startsWith(this.command)
    }

    get help() {
      return `${this.command} ${this.args.join(' ')}`
    }

    withArg(arg: string, builder?: (arg: ArgParser.Builder) => ArgParser.Builder) {
      let argBuilder = ArgParser.Builder.create(arg)
      if (builder) {
        argBuilder = builder(argBuilder)
      }
      this.args.push(argBuilder.build())
      return this
    }

    withOptionalArg(arg: string, builder?: (arg: ArgParser.Builder) => ArgParser.Builder) {
      let argBuilder = ArgParser.Builder.create(arg)
      if (builder) {
        argBuilder = builder(argBuilder)
      }
      this.args.push(`[${argBuilder.build()}]`)
      return this
    }

    static create(command: string) {
      return new ArgParser(`/${command}`, [])
    }
  }

  export namespace ArgParser {
    export class Builder {

      private constructor(private args: string[]) {}

      or(arg: string) {
        this.args.push(`${arg}`)
        return this
      }

      build() {
        return this.args.join(' | ')
      }

      static create(arg: string) {
        return new Builder([arg])
      }
    }
  }
}
