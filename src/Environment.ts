import { forkJoin, map, mergeMap, Observable } from 'rxjs';
import { JMessage } from './JMessage';
import { ObjectStore, Store, StringStore } from './Store';

export interface Environment {
  store: {
    string: StringStore
    object: ObjectStore
  }
  message: JMessage
}

export namespace Environment {
  export const from = (message$: Observable<JMessage>): Observable<Environment> => {
    return message$.pipe(
      mergeMap(message => {
        return forkJoin({
          string: Store.getOrCreateStringStore(message),
          object: Store.getOrCreateObjectStore(message),
        })
        .pipe(map(store => ({ store, message })))
      })
    )
  }
}
