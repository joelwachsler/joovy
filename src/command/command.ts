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

export namespace Command {
  export interface Command {
    /**
     * Example query - for example /play url | query.
     */
    command: string

    /**
     * Describe what the command does.
     */
    helpText: string

    /**
     * Will call command methods until one returns true, or there are no commands left.
     */
    handleMessage(message: Message): Promise<boolean>
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

    return new CommandHolder(env, [...cmds, help])
  }

  class CommandHolder {

    constructor(private env: Environment, private cmds: Command.Command[]) {}

    async handleMessage(message: Message): Promise<void> {
      for (const cmd of this.cmds) {
        if (await cmd.handleMessage(message)) {
          return
        }
      }

      this.env.sendMessage.next(`Unknown command: \`${message.content}\`, type \`/help\` for available commands.`)
    }
  }
}
