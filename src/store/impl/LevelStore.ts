import levelup from 'levelup'
import rocksdb from 'rocksdb'
import { defer, Observable, of } from 'rxjs'
import Store from '../Store'

class LevelStore implements Store<string> {
  constructor(private store: StoreType) { }

  put(key: string, value: string): Observable<string> {
    return new Observable(subscribe => {
      this.store.put(key, value, err => {
        if (err) {
          return subscribe.error(err)
        }

        subscribe.next(value)
        subscribe.complete()
      })
    })
  }

  get(key: string): Observable<string> {
    return new Observable(subscribe => {
      this.store.get(key, (err, val) => {
        if (err) {
          return subscribe.error(err)
        }

        subscribe.next(val.toString())
        subscribe.complete()
      })
    })
  }

  remove(key: string): Observable<void> {
    return new Observable(subscribe => {
      this.store.del(key, err => {
        if (err) {
          return subscribe.error(err)
        }

        subscribe.next()
        subscribe.complete()
      })
    })
  }
}

const createStore = () => {
  return levelup(rocksdb('./mydb'))
}

export const getOrCreateStore = (): Observable<Store<string>> => {
  return defer(() => {
    if (!store) {
      store = createStore()
    }

    return of(new LevelStore(store))
  })
}

type StoreType = ReturnType<typeof createStore>

let store: StoreType
