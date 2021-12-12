import { Message } from 'discord.js'
import { map, Observable } from 'rxjs'
import { JMessage } from './JMessage'
import * as Player from './player/Player'
import { getOrCreateObjectStore, getOrCreateStringStore, ObjectStore, StringStore } from './Store'

export default interface JEvent {
  readonly store: EventStore
  readonly factory: Factory
  readonly message: JMessage
  withResult(resultToAdd: any): this
  readonly result: any[]
}

export const from = (message$: Observable<Message>): Observable<JEvent> => {
  return message$.pipe(
    map(message => Base(message)),
    map(EventClass => WithStore(EventClass)),
    map(EventClass => WithResult(EventClass)),
    map(EventClass => WithFactory(EventClass)),
    map(EventClass => new EventClass()),
  )
}

interface EventStore {
  string: Observable<StringStore>
  object: Observable<ObjectStore>
}

interface Factory {
  player: Player.Factory
}

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T = {}> = new (...args: any[]) => T
type BaseConstructor<T extends JMessage = Message> = Constructor<{ message: T }>

const Base = (message: Message) => {
  return class {
    message = message
  }
}

export const WithStore = <TBase extends BaseConstructor<JMessage>>(Base: TBase) => {
  return class extends Base implements EventStore {
    get string() {
      return getOrCreateStringStore(this.message)
    }

    get object() {
      return getOrCreateObjectStore(this.message)
    }

    get store() {
      return this
    }
  }
}

export const WithFactory = <TBase extends BaseConstructor>(Base: TBase) => {
  return class extends Base implements Factory {
    get player() {
      return Player.from(this.message)
    }

    get factory() {
      return this
    }
  }
}

export const WithResult = <TBase extends Constructor>(Base: TBase) => {
  return class extends Base {
    private _result: any[] = []

    get result() {
      return this._result
    }

    /**
     * Needed to prevent jest matcher errors.
     */
    set result(result: any[]) {
      this._result = result
    }

    withResult(resultToAdd: any) {
      this.result.push(resultToAdd)
      return this
    }
  }
}
