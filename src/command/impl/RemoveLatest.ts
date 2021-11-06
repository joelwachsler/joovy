import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command, ArgParser } from '../command'

export class RemoveLatest implements Command {
  argument = ArgParser.create('removelatest')
  helpText = 'Removes the last added track.'

  constructor(private env: Environment) {}

  async handleMessage(_: Message) {
    this.env.removeLatestFromQueue.next(null)
  }
}
