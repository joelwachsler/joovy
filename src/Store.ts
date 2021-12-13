import { defer, EMPTY, Observable, of } from 'rxjs'
import { JMessage } from './JMessage'

export default interface Store<T> {
  put(key: string, value: T): Observable<T>
  get(key: string): Observable<T>
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
    return defer(() => {
      const res = this.storage.get(key)
      return res
        ? of(res)
        : EMPTY
    })
  }

  remove(key: string) {
    return defer(() => {
      this.storage.delete(key)
      return of(undefined)
    })
  }
}

export type StoreProvider = () => Map<string, any>

type GetStoreArgs = { message: JMessage, storeProvider: StoreProvider }

export const getOrCreateStringStore = (args: GetStoreArgs): Observable<StringStore> => {
  return of(getOrCreateInMemoryStore(args))
}

export const getOrCreateObjectStore = (args: GetStoreArgs): Observable<ObjectStore> => {
  return of(getOrCreateInMemoryStore(args))
}

export const getOrCreateInMemoryStore = (args: GetStoreArgs): Store<any> => {
  const { message, storeProvider } = { ...args, storeProvider: args.storeProvider }
  const store = storeProvider()

  if (!store.has(message.channelId)) {
    store.set(message.channelId, new InMemoryStore())
  }

  return store.get(message.channelId) ?? throwError('Store is not defined!')
}

const throwError = (err: string) => {
  throw Error(err)
}
