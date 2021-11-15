import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'

export class Queue implements Command {
  argument = Command.ArgParser.create('queue')
  helpText = 'Print the current queue.'

  constructor(private env: Environment) {}

  handleMessage(_: Message) {
    this.env.printQueueRequest.next(null)
  }
}
