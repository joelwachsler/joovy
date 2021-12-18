import { Message, MessageEmbed } from 'discord.js'
import { defer, from, mapTo, mergeMapTo, Observable } from 'rxjs'
import JEvent, { BaseConstructor, Result, SendMessage } from '../JEvent'

const WithSendMessage = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements SendMessage {
    sendMessage(message: string | MessageEmbed): Observable<Result> {
      return sendMessage({
        event: this as unknown as JEvent,
        message,
        messageSender: msg => defer(() => from(this.message.channel.send({ embeds: [msg] })))
          .pipe(mapTo(undefined)),
        indent: 2,
      })
    }
  }
}

export interface SendMessageArgs {
  message: string | MessageEmbed
  messageSender: MessageSender
  event: JEvent
  indent: number
}

export const sendMessage = ({ message, messageSender, event, indent }: SendMessageArgs) => {
  let msg = message

  if (typeof msg === 'string') {
    msg = new MessageEmbed()
      .setDescription(msg)
  }

  return messageSender(msg)
    .pipe(mergeMapTo(event.result({ messageSent: `${JSON.stringify(msg.toJSON(), null, indent)}` })))
}

type MessageSender  = (message: MessageEmbed) => Observable<void>

export default WithSendMessage
