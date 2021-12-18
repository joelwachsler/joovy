import { Observable } from 'rxjs'
import { ObjectStore, StringStore } from '../Store'

export interface EventStore {
  readonly store: {
    readonly string: Observable<StringStore>
    readonly object: Observable<ObjectStore>
  }
}
