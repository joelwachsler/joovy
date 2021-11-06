import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command, ArgParser } from '../command'

export class Queue implements Command {
  argument = ArgParser.create('queue')
  helpText = 'Print the current queue.'

  constructor(private env: Environment) {}

  async handleMessage(_: Message) {
    this.env.printQueueRequest.next(null)
  }
}
