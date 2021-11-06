import { Message, MessageEmbed } from 'discord.js'
import { Command, ArgParser } from '../command'

export class Help implements Command {
  argument = ArgParser.create('help')
  helpText = 'Print this message'

  constructor(private cmds: Command[]) {}

  async handleMessage(message: Message) {
    const commands: Command[] = [...this.cmds, this]

    const help = new MessageEmbed()
      .setTitle('Available commands')
      .addFields(commands.map(cmd => ({
        name: cmd.argument.help,
        value: cmd.helpText,
      })))

    message.channel.send({
      embeds: [help],
    })
  }
}
