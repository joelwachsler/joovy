import { defer, EMPTY, of } from 'rxjs'
import JMessage from '../../JMessage'
import Store, { StoreProvider } from '../Store'

export default class InMemoryStore<T> implements Store<T> {
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

export type GetStoreArgs = { message: JMessage, storeProvider: StoreProvider }

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