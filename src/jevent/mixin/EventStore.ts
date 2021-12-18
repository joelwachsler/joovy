import { getOrCreateObjectStore, getOrCreateStringStore, StoreProvider } from '../../Store'
import { BaseConstructor, EventStore } from '../JEvent'

const WithEventStore = <TBase extends BaseConstructor>(Base: TBase, storeProvider: StoreProvider) => {
  return class extends Base implements EventStore {

    get string() {
      return getOrCreateStringStore({ message: this.message, storeProvider })
    }

    get object() {
      return getOrCreateObjectStore({ message: this.message, storeProvider })
    }

    get store() {
      return this
    }
  }
}

export default WithEventStore
