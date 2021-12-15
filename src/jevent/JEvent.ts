import { Message, MessageEmbed } from 'discord.js'
import { delay, map, Observable } from 'rxjs'
import { JMessage } from '../JMessage'
import * as Player from '../player/Player'
import { ObjectStore, StoreProvider, StringStore } from '../Store'
import WithEventStore from './impl/EventStore'
import WithFactory from './impl/Factory'
import WithResult from './impl/Result'
import WithSendMessage from './impl/SendMessage'

export default interface JEvent extends Result, Factory, EventStore, SendMessage {
  readonly message: JMessage
}

export const from = (message$: Observable<Message>): Observable<JEvent> => {
  const store = new Map<string, unknown>()

  return message$.pipe(
    map(message => WithBaseFunctionality(message, () => store)),
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

export const WithBaseFunctionality = <T extends JMessage = JMessage>(message: T, storeProvider: StoreProvider) => {
  return WithResult(WithEventStore(Base(message), storeProvider))
}

export interface EventStore {
  readonly store: {
    readonly string: Observable<StringStore>
    readonly object: Observable<ObjectStore>
  }
}

export const delayFactoryImpl = <T>(ms: number) => delay<T>(ms)

export type DelayFactory = typeof delayFactoryImpl

export interface Factory {
  readonly factory: {
    readonly player: Player.Factory
    readonly delay: DelayFactory
  }
}

export type ResultResult = string | Record<string, unknown>

export type ResultArg<T = undefined> = { result: ResultResult, item: T }

export interface Result {
  result(resultToAdd: ResultResult, ...andThen: Observable<ResultEntry>[]): Observable<ResultEntry>
  complexResult<T = undefined>(arg: ResultArg<T>, ...andThen: Observable<ResultEntry>[]): Observable<ResultEntry<T>>
}

export interface ResultEntry<T = any> {
  item: T,
  result: ResultResult
  event: JEvent
}

export interface SendMessage {
  sendMessage(message: string | MessageEmbed): Observable<ResultEntry>
}
