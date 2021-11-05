import { Message, MessageEmbed } from 'discord.js'
import { Command } from '../command'

export class Help implements Command {
  command = '/help'
  helpText = 'Print this message'

  constructor(private cmds: Command[]) {}

  async handleMessage(message: Message): Promise<boolean> {
    if (!message.content.startsWith('/help')) {
      return false
    }

    const commands: Command[] = [...this.cmds, this]

    const help = new MessageEmbed()
      .setTitle('Available commands')
      .addFields(commands.map(cmd => ({
        name: cmd.command,
        value: cmd.helpText,
      })))

    message.channel.send({
      embeds: [help],
    })

    return true
  }
}
