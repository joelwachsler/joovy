import { defer, Observable, of } from 'rxjs'
import { JMessage } from './JMessage'

export default interface Store<T> {
  put(key: string, value: T): Observable<T>
  get(key: string): Observable<T | undefined>
  remove(key: string): Observable<void>
}

export type StringStore = Store<string>
export type ObjectStore = Store<any>

class InMemoryStore<T> implements Store<T> {
  private storage = new Map<string, T>()

  put(key: string, value: T) {
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

const storeStore = new Map<string, any>()

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

  return storeStore.get(msg.channelId) ?? throwError('Store is not defined!')
}

const throwError = (err: string) => {
  throw Error(err)
}
