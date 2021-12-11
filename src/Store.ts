import { defer, Observable, of } from 'rxjs'
import { JMessage } from './JMessage'

interface Store<T> {
  put(key: string, value: T): Observable<T>
  get(key: string): Observable<T | undefined>
  remove(key: string): Observable<void>
}

export type StringStore = Store<string>
export type ObjectStore = Store<any>

export namespace Store {

  class InMemoryStore implements Store<any> {
    private storage = new Map<string, any>()

    put(key: string, value: any) {
      return defer(() => {
        this.storage.set(key, value)
        return of(value)
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

  const storeStore = new Map<string, StringStore>()

  export const getOrCreateStringStore = (msg: JMessage): Observable<StringStore> => {
    return of(getOrCreateInMemoryStore(msg))
  }

  export const getOrCreateObjectStore = (msg: JMessage): Observable<ObjectStore> => {
    return of(getOrCreateInMemoryStore(msg))
  }

  export const getOrCreateInMemoryStore = (msg: JMessage): Store<any> => {
    if (!storeStore.has(msg.channelId)) {
      storeStore.set(msg.channelId, new InMemoryStore())
    }

    return storeStore.get(msg.channelId)!
  }
}
