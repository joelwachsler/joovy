import { Message, MessageEmbed } from 'discord.js'
import { from, mergeMapTo, Observable } from 'rxjs'
import JEvent, { BaseConstructor, ResultEntry, SendMessage } from '../JEvent'

const WithSendMessage = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements SendMessage {
    sendMessage(message: string | MessageEmbed): Observable<ResultEntry> {
      const event = this as unknown as JEvent
      let msg = message

      if (typeof msg === 'string') {
        msg = new MessageEmbed()
          .setDescription(msg)
      }

      return from(this.message.channel.send({ embeds: [msg] }))
        .pipe(mergeMapTo(event.result({ messageSent: `${JSON.stringify(msg.toJSON())}` })))
    }
  }
}

export default WithSendMessage
