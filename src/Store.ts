import { defer, Observable, of } from 'rxjs'
import { JMessage } from './JMessage'

interface BaseStore<T> {
  set(key: string, value: T): Observable<void>
  get(key: string): Observable<T | undefined>
  remove(key: string): Observable<void>
}

export interface Store extends BaseStore<string> { }

export interface ObjectStore extends BaseStore<any> { }

export namespace Store {

  class InMemoryStore implements BaseStore<any> {
    private storage = new Map<string, any>()

    set(key: string, value: any) {
      return defer(() => {
        this.storage.set(key, value)
        return of(undefined)
      })
    }

    get(key: string) {
      return defer(() => of(this.storage.get(key)))
    }

    remove(key: string) {
      return defer(() => {
        this.storage.delete(key)
        return of(undefined)
      })
    }
  }

  const storeStore = new Map<string, Store>()

  export const getOrCreateStore = (msg: JMessage): Observable<Store> => {
    return of(getOrCreateInMemoryStore(msg))
  }

  export const getOrCreateInMemoryStore = (msg: JMessage): Store => {
    if (!storeStore.has(msg.channelId)) {
      storeStore.set(msg.channelId, new InMemoryStore())
    }

    return storeStore.get(msg.channelId)!
  }
}
