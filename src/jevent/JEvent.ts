import { Message } from 'discord.js'
import { map, Observable } from 'rxjs'
import { JMessage } from '../JMessage'
import * as Player from '../player/Player'
import { ObjectStore, StringStore } from '../Store'
import WithEventStore from './impl/EventStore'
import WithFactory from './impl/Factory'
import WithResult from './impl/Result'

export default interface JEvent extends Result, Factory, EventStore {
  readonly message: JMessage
}

export const from = (message$: Observable<Message>): Observable<JEvent> => {
  return message$.pipe(
    map(message => Base(message)),
    map(EventClass => WithEventStore(EventClass)),
    map(EventClass => WithResult(EventClass)),
    map(EventClass => WithFactory(EventClass)),
    map(EventClass => new EventClass()),
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Constructor<T = {}> = new (...args: any[]) => T
export type BaseConstructor<T extends JMessage = Message> = Constructor<{ message: T }>

const Base = (message: Message) => {
  return class {
    message = message
  }
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

export interface Result {
  withResult(resultToAdd: any): this
  readonly result: any[]
}
