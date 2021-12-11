import { Message } from 'discord.js';
import { map, Observable } from 'rxjs';
import { JMessage } from './JMessage';
import { Player } from './player/Player';
import { ObjectStore, Store, StringStore } from './Store';

export interface Event {
  store: Event.Store
  factory: Event.Factory
  message: JMessage
  withResult(resultToAdd: any): this
  result: any
}

export namespace Event {
  export const from = (message$: Observable<Message>): Observable<Event> => {
    return message$.pipe(
      map(message => Base(message)),
      map(EventClass => WithStore(EventClass)),
      map(EventClass => WithResult(EventClass)),
      map(EventClass => WithFactory(EventClass)),
      map(EventClass => new EventClass()),
    )
  }

  export interface Store {
    string: Observable<StringStore>
    object: Observable<ObjectStore>
  }

  export interface Factory {
    player: Player.Factory
  }

  type Constructor<T = {}> = new (...args: any[]) => T
  type BaseConstructor<T = Message> = Constructor<{ message: T }>

  const Base = (message: Message) => {
    return class {
      message = message
    }
  }

  export const WithStore = <TBase extends BaseConstructor<JMessage>>(Base: TBase) => {
    return class extends Base implements Store {
      get string() {
        return Store.getOrCreateStringStore(this.message)
      }

      get object() {
        return Store.getOrCreateObjectStore(this.message)
      }

      get store() {
        return this
      }
    }
  }

  const WithFactory = <TBase extends BaseConstructor>(Base: TBase) => {
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
      private _result: any

      get result() {
        return this._result
      }

      withResult(resultToAdd: any) {
        this._result = {...this._result, ...resultToAdd}
        return this
      }
    }
  }
}
