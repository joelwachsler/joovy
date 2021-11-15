import { Message } from 'discord.js'
import { Environment } from '../../environment'
import { Command } from '../command'

export class RemoveLatest implements Command {
  argument = Command.ArgParser.create('removelatest')
  helpText = 'Removes the last added track.'

  constructor(private env: Environment) {}

  handleMessage(_: Message) {
    this.env.removeLatestFromQueue.next(null)
  }
}
