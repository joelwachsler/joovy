import { Message } from 'discord.js'
import { Pool } from 'threads'
import { Environment } from '../connectionHandler'
import { Bass } from './impl/Bass'
import { Help } from './impl/Help'
import { Play } from './impl/Play'
import { PlayNext } from './impl/PlayNext'
import { Seek } from './impl/Seek'
import { Skip } from './impl/Skip'
import { RemoveLatest } from './impl/RemoveLatest'
import { Remove } from './impl/Remove'
import { Queue } from './impl/Queue'
import { Disconnect } from './impl/Disconnect'

export interface Command {
  /**
   * Defines when the current command should be run, its arguments and a description of it.
   */
  argument: ArgParser

  /**
   * Describe what the command does.
   */
  helpText: string

  /**
   * Will be called if the message sent starts with the one defined in command.
   */
  handleMessage(message: Message): Promise<void>
}

export const init = (env: Environment, pool: Pool<any>) => {
  const cmds = [
    new PlayNext(env, pool),
    new Play(env, pool),
    new Seek(env),
    new Skip(env),
    new Bass(env),
    new RemoveLatest(env),
    new Remove(env),
    new Queue(env),
    new Disconnect(env),
  ]

  const help = new Help(cmds)

  return new Handler(env, [...cmds, help], help)
}

export class ArgParser {

  private constructor(public command: string, private args: string[]) {}

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
    this.args.push(`[${argBuilder.build()}]`)
    return this
  }

  static create(command: string) {
    return new ArgParser(`/${command}`, [])
  }
}

class ArgBuilder {

  private constructor(private args: string[]) {}

  or(arg: string) {
    this.args.push(`${arg}`)
    return this
  }

  build() {
    return this.args.join(' | ')
  }

  static create(arg: string) {
    return new ArgBuilder([arg])
  }
}

class Handler {

  constructor(private env: Environment, private cmds: Command[], private helpCmd: Help) {}

  async handleMessage(message: Message): Promise<void> {
    const { content } = message
    for (const cmd of this.cmds) {
      if (cmd.argument.is(content)) {
        return await cmd.handleMessage(message)
      }
    }

    this.env.sendMessage.next(`Unknown command: \`${message.content}\`, type \`${this.helpCmd.argument.command}\` for available commands.`)
  }
}
