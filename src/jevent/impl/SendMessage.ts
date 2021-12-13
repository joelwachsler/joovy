import { Message, MessageEmbed } from 'discord.js'
import { from, mergeMap, Observable } from 'rxjs'
import JEvent, { BaseConstructor, ResultEntry, SendMessage } from '../JEvent'

const WithSendMessage = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements SendMessage {
    sendMessage(message: string | MessageEmbed): Observable<ResultEntry> {
      const event = this as unknown as JEvent

      if (message instanceof MessageEmbed) {
        return from(this.message.channel.send({ embeds: [message] }))
          .pipe(mergeMap(() => event.result({ messageSent: `${message.toJSON()}` })))
      } else {
        return from(this.message.channel.send(message))
          .pipe(mergeMap(() => event.result({ messageSent: message })))
      }
    }
  }
}

export default WithSendMessage
