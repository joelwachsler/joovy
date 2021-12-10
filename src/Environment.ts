import { map, mergeMap, Observable, OperatorFunction } from 'rxjs';
import { JMessage } from './JMessage';
import { Store } from './Store';

export interface Environment {
  store: Store
  message: JMessage
}

export namespace Environment {
  export const from = (message$: Observable<JMessage>): Observable<Environment> => {
    return message$.pipe(
      mergeMap(message => Store.getOrCreateStore(message)
        .pipe(map(store => ({ store, message })))
      )
    )
  }
}
