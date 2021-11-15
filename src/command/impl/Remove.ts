import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'

export class Remove implements Command {
  argument = Command.ArgParser.create('remove')
    .withArg('fromIndex')
    .withOptionalArg('toIndex')
  helpText = 'Remove specified track(s).'

  constructor(private env: Environment) {}

  handleMessage(message: Message) {
    const removeCmd = message.content.split(' ')
    const from = Number(removeCmd[1])
    const to = Number(removeCmd[2] ?? from)
    this.env.removeFromQueue.next({ from, to })
  }
}
