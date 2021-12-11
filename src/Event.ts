import { Message } from 'discord.js';
import { forkJoin, map, Observable } from 'rxjs';
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
  export const from = (message: Message): Observable<Event> => {
    return forkJoin({
      string: Store.getOrCreateStringStore(message),
      object: Store.getOrCreateObjectStore(message),
    })
    .pipe(
      map(store => Base(store, message)),
      map(EventClass => WithResult(EventClass)),
      map(EventClass => WithFactory(EventClass)),
      map(EventClass => new EventClass()),
    )
  }

  export interface Store {
    string: StringStore
    object: ObjectStore
  }

  export interface Factory {
    player: Player.Factory
  }

  type Constructor<T = {}> = new (...args: any[]) => T
  type BaseConstructor = Constructor<{ message: Message }>

  const Base = (store: Store, message: Message) => {
    return class {
      store = store
      message = message
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
