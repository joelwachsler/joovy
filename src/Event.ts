import { Message } from 'discord.js';
import { forkJoin, map, Observable } from 'rxjs';
import { JMessage } from './JMessage';
import { Player } from './player/Player';
import { ObjectStore, Store, StringStore } from './Store';

export interface Event {
  store: {
    string: StringStore
    object: ObjectStore
  }
  factory: Event.Factory
  message: JMessage
  addResult(resultToAdd: any): void
  result: any
}

export namespace Event {
  export interface Factory {
    player: Player.Factory
  }

  export class FactoryImpl implements Factory {
    constructor(private message: Message) {}

    get player() {
      return Player.from(this.message)
    }
  }

  export type JMessageAndFactory = { message: JMessage, factory: Factory }

  export const from = ({ message, factory }: JMessageAndFactory): Observable<Event> => {
    return forkJoin({
      string: Store.getOrCreateStringStore(message),
      object: Store.getOrCreateObjectStore(message),
    })
    .pipe(map(store => withResult({ store, message, factory })))
  }

  export const withResult = (obj: any) => {
    let result = {}

    return {
      ...obj,
      result,
      addResult(resultToAdd: any) {
        result = {...result, resultToAdd}
      },
    }
  }
}
