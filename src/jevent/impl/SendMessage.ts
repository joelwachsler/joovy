import { Message, MessageEmbed } from 'discord.js'
import { from, mergeMap, Observable } from 'rxjs'
import JEvent, { BaseConstructor, ResultEntry, SendMessage } from '../JEvent'

const WithSendMessage = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements SendMessage {
    sendMessage(event: JEvent, message: string | MessageEmbed): Observable<ResultEntry> {
      if (message instanceof MessageEmbed) {
        return from(this.message.channel.send({ embeds: [message] }))
          .pipe(mergeMap(() => event.withResult({ messageSent: `${message.toJSON()}` })))
      } else {
        return from(this.message.channel.send(message))
          .pipe(mergeMap(() => event.withResult({ messageSent: message })))
      }
    }
  }
}

export default WithSendMessage
