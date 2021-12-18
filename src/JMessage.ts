import { Message, MessageOptions, MessagePayload } from 'discord.js'
import { defer, from as rxFrom, map, mapTo, mergeMap, Observable, of } from 'rxjs'

/**
 * Facade around Message for easier test implementations.
 */
export default interface JMessage {
  channelId: string
  author: {
    username: string
    bot: boolean
    id: string
  }
  content: string
  edit(update: Partial<JMessage>): Observable<JMessage>
  clearReactions(): Observable<JMessage>
  react(reaction: string): Observable<JMessage>
  send(message: string | MessagePayload | MessageOptions): Observable<JMessage>
}

class JMessageImpl implements JMessage {
  constructor(private message: Message) {}

  get channelId() {
    return this.message.channelId
  }

  get author() {
    return this.message.author
  }

  get content() {
    return this.message.content
  }

  edit(update: Partial<JMessage>): Observable<JMessage> {
    return defer(() => rxFrom(this.message.edit(update))).pipe(
      map(updatedMsg => new JMessageImpl(updatedMsg)),
    )
  }

  clearReactions(): Observable<JMessage> {
    return defer(() => of(this.message.reactions)).pipe(
      mergeMap(reactionManager => reactionManager.removeAll()),
      map(resultingMessage => new JMessageImpl(resultingMessage)),
    )
  }

  react(reaction: string): Observable<JMessage> {
    return defer(() => rxFrom(this.message.react(reaction))).pipe(
      mapTo(this),
    )
  }

  send(message: string | MessagePayload | MessageOptions): Observable<JMessage> {
    return defer(() => rxFrom(this.message.channel.send(message))).pipe(
      map(msg => new JMessageImpl(msg)),
    )
  }
}

export const from = (message: Message): JMessage => new JMessageImpl(message)
