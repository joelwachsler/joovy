import { Observable, of } from 'rxjs'
import { getOrCreateInMemoryStore, GetStoreArgs } from './impl/InMemoryStore'

export default interface Store<T> {
  put(key: string, value: T): Observable<T>
  get(key: string): Observable<T>
  remove(key: string): Observable<void>
}

export type StringStore = Store<string>

export type ObjectStore = Store<any>

export type StoreProvider = () => Map<string, any>

export const getOrCreateStringStore = (args: GetStoreArgs): Observable<StringStore> => {
  return of(getOrCreateInMemoryStore(args))
}

export const getOrCreateObjectStore = (args: GetStoreArgs): Observable<ObjectStore> => {
  return of(getOrCreateInMemoryStore(args))
}
