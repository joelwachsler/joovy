import { Message } from 'discord.js'
import { map, Observable } from 'rxjs'
import { EventStore } from './EventStore'
import { Factory } from './Factory'
import { WithBaseFunctionality } from './mixin/BaseFunctionality'
import WithFactory from './mixin/Factory'
import WithSendMessage from './mixin/SendMessage'
import { ResultFactory } from './Result'
import { SendMessage } from './SendMessage'
import JMessage, { from as jMessageFrom } from '../JMessage'

/**
 * "JEvent" or "Joovy Event" represents an interaction a user or bot has created.
 * 
 * The main reason for this interface is to make it easier to create "mock"
 * implementations of a user interaction.
 */
export default interface JEvent extends ResultFactory, Factory, EventStore, SendMessage {
  readonly message: JMessage
  readonly timestamp: number,
}

export const from = (message: Observable<Message>): Observable<JEvent> => {
  const store = new Map<string, unknown>()

  return message.pipe(
    map(message => WithFactory(WithBaseFunctionality(jMessageFrom(message), () => store, message.createdTimestamp), message)),
    map(EventClass => WithSendMessage(EventClass)),
    map(EventClass => new EventClass()),
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Constructor<T = {}> = new (...args: any[]) => T
export type BaseConstructor<T extends JMessage = JMessage> = Constructor<{ message: T }>

export const Base = <T extends JMessage = JMessage>(message: T, timestamp: number) => {
  return class {
    message = message
    timestamp = timestamp
  }
}