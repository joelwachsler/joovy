import { Message, MessageEmbed } from 'discord.js'
import { map, Observable } from 'rxjs'
import { JMessage } from '../JMessage'
import * as Player from '../player/Player'
import { ObjectStore, StringStore } from '../Store'
import WithEventStore from './impl/EventStore'
import WithFactory from './impl/Factory'
import WithResult from './impl/Result'
import WithSendMessage from './impl/SendMessage'

export default interface JEvent extends Result, Factory, EventStore, SendMessage {
  readonly message: JMessage
}

export const from = (message$: Observable<Message>): Observable<JEvent> => {
  return message$.pipe(
    map(message => WithBaseFunctionality(message)),
    map(EventClass => WithFactory(EventClass)),
    map(EventClass => WithSendMessage(EventClass)),
    map(EventClass => new EventClass()),
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Constructor<T = {}> = new (...args: any[]) => T
export type BaseConstructor<T extends JMessage = JMessage> = Constructor<{ message: T }>

const Base = <T extends JMessage = JMessage>(message: T) => {
  return class {
    message = message
  }
}

export const WithBaseFunctionality = <T extends JMessage = JMessage>(message: T) => {
  return WithResult(WithEventStore(Base(message)))
}

export interface EventStore {
  readonly store: {
    readonly string: Observable<StringStore>
    readonly object: Observable<ObjectStore>
  }
}

export interface Factory {
  readonly factory: {
    readonly player: Player.Factory
  }
}

export type ResultResult = string | Record<string, string | boolean>

export interface Result {
  withResult(resultToAdd: ResultResult, ...andThen: Observable<ResultEntry>[]): Observable<ResultEntry>
}

export interface ResultEntry {
  result: ResultResult
  event: JEvent
}

export interface SendMessage {
  sendMessage(event: JEvent, message: string | MessageEmbed): Observable<ResultEntry>
}
