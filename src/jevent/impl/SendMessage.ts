import { Message, MessageEmbed } from 'discord.js'
import { from, Observable } from 'rxjs'
import JEvent, { BaseConstructor, SendMessage } from '../JEvent'

const WithSendMessage = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements SendMessage {
    sendMessage(event: JEvent, message: string | MessageEmbed): Observable<Message> {
      event.withResult({ message: `Sending: ${JSON.stringify(message)}` })

      if (message instanceof MessageEmbed) {
        return from(this.message.channel.send({
          embeds: [message],
        }))
      } else {
        return from(this.message.channel.send(message))
      }
    }
  }
}

export default WithSendMessage