import { Message, MessageEmbed } from 'discord.js'
import { map, Observable } from 'rxjs'
import { JMessage } from '../JMessage'
import * as Player from '../player/Player'
import { ObjectStore, StoreProvider, StringStore } from '../Store'
import { delayFactoryImpl } from './impl/delay'
import { ytSearchFactoryImpl } from './impl/ytSearch'
import WithEventStore from './mixin/EventStore'
import WithFactory from './mixin/Factory'
import WithResult from './mixin/Result'
import WithSendMessage from './mixin/SendMessage'

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

export const from = (message$: Observable<Message>): Observable<JEvent> => {
  const store = new Map<string, unknown>()

  return message$.pipe(
    map(message => WithBaseFunctionality(message, () => store, message.createdTimestamp)),
    map(EventClass => WithFactory(EventClass)),
    map(EventClass => WithSendMessage(EventClass)),
    map(EventClass => new EventClass()),
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Constructor<T = {}> = new (...args: any[]) => T
export type BaseConstructor<T extends JMessage = JMessage> = Constructor<{ message: T }>

const Base = <T extends JMessage = JMessage>(message: T, timestamp: number) => {
  return class {
    message = message
    timestamp = timestamp
  }
}

export const WithBaseFunctionality = <T extends JMessage = JMessage>(message: T, storeProvider: StoreProvider, timestamp: number) => {
  return WithResult(WithEventStore(Base(message, timestamp), storeProvider))
}

export interface EventStore {
  readonly store: {
    readonly string: Observable<StringStore>
    readonly object: Observable<ObjectStore>
  }
}

export type DelayFactory = typeof delayFactoryImpl

export interface YtSearchResult {
  url: string
  title: string
  timestamp: string
}

export type YtSearchFactory = typeof ytSearchFactoryImpl

export interface Factory {
  readonly factory: {
    readonly player: Player.Factory
    readonly delay: DelayFactory
    readonly ytSearch: YtSearchFactory
  }
}

export type ResultResult = string | Record<string, unknown>

export type ResultArg<T = undefined> = { result: ResultResult, item: T }

export interface ResultFactory {
  result(resultToAdd: ResultResult, ...andThen: Observable<Result>[]): Observable<Result>
  complexResult<T = undefined>(arg: ResultArg<T>, ...andThen: Observable<Result>[]): Observable<Result<T>>
  empty(): Observable<EmptyResult>
}

export class EmptyResult implements Result {
  constructor(public event: JEvent) {}

  item: any
  result: ResultResult = ''
}

export interface Result<T = any> {
  item: T,
  result: ResultResult
  event: JEvent
}

export interface SendMessage {
  sendMessage(message: string | MessageEmbed): Observable<Result>
}
