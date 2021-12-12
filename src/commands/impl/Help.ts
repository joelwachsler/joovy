import { MessageEmbed } from 'discord.js'
import { mergeMapTo, Observable } from 'rxjs'
import JEvent, { ResultEntry } from '../../jevent/JEvent'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Help implements Command {
  argument = ArgParser.create('help')
  helpText = 'Print this message.'

  private commands: Command[]

  constructor(commands: Command[]) {
    this.commands = [...commands, this]
  }

  handleMessage(event: JEvent): Observable<ResultEntry> {
    const help = new MessageEmbed()
      .setTitle('Available commands')
      .addFields(this.commands.map(cmd => ({
        name: cmd.argument.help,
        value: cmd.helpText,
      })))

    return event.sendMessage(event, help)
      .pipe(mergeMapTo(event.withResult({ help: 'called' })))
  }
}
