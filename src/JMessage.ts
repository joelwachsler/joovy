import { Message, MessageOptions, MessagePayload } from 'discord.js'
import { defer, filter, from as rxFrom, map, mapTo, mergeMap, Observable, of } from 'rxjs'
import { QueueReactions } from './commands/impl/Queue'

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
  clearReactions$: Observable<JMessage>
  reactions$: Observable<JReaction>
  edit(update: MessageContent): Observable<JMessage>
  react(reaction: string): Observable<JMessage>
  send(message: MessageContent): Observable<JMessage>
}

export type MessageContent = string | MessagePayload | MessageOptions

export type JReaction = string

class JMessageImpl implements JMessage {
  constructor(private message: Message) { }

  get channelId() {
    return this.message.channelId
  }

  get author() {
    return this.message.author
  }

  get content() {
    return this.message.content
  }

  get clearReactions$(): Observable<JMessage> {
    return defer(() => of(this.message.reactions)).pipe(
      mergeMap(reactionManager => reactionManager.removeAll()),
      map(resultingMessage => new JMessageImpl(resultingMessage)),
    )
  }

  get reactions$(): Observable<JReaction> {
    const reactions$ = defer(() => rxFrom(this.message.awaitReactions({
      filter: (reaction, user) => {
        const emojiName = reaction.emoji.name
        if (emojiName == null) {
          return false
        }

        if (user.bot) {
          return false
        }

        const reactions = [
          QueueReactions.TWO_PREVIOUS,
          QueueReactions.PREVIOUS,
          QueueReactions.NEXT,
          QueueReactions.TWO_NEXT,
        ]

        const reactionsAsString = reactions.map(r => `${r}`)
        return reactionsAsString.includes(emojiName)
      },
      max: 1,
      time: 60000,
      errors: ['time'],
    })))

    const firstReaction$ = reactions$.pipe(
      filter(reactions => reactions.size > 0),
      mergeMap(reactions => [reactions.first()]),
      mergeMap(reaction => reaction !== undefined ? [reaction] : []),
    )

    return firstReaction$.pipe(
      map(reaction => reaction.emoji.name),
      mergeMap(emojiReaction => emojiReaction !== null ? [emojiReaction] : []),
    )
  }

  edit(update: MessageContent): Observable<JMessage> {
    return defer(() => rxFrom(this.message.edit(update))).pipe(
      map(updatedMsg => new JMessageImpl(updatedMsg)),
    )
  }

  react(reaction: string): Observable<JMessage> {
    return defer(() => rxFrom(this.message.react(reaction))).pipe(
      mapTo(this),
    )
  }

  send(message: MessageContent): Observable<JMessage> {
    return defer(() => rxFrom(this.message.channel.send(message))).pipe(
      map(msg => new JMessageImpl(msg)),
    )
  }
}

export const from = (message: Message): JMessage => new JMessageImpl(message)
