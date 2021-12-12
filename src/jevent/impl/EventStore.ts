import { JMessage } from '../../JMessage'
import { getOrCreateObjectStore, getOrCreateStringStore } from '../../Store'
import { BaseConstructor, EventStore } from '../JEvent'

const WithEventStore = <TBase extends BaseConstructor<JMessage>>(Base: TBase) => {
  return class extends Base implements EventStore {
    get string() {
      return getOrCreateStringStore(this.message)
    }

    get object() {
      return getOrCreateObjectStore(this.message)
    }

    get store() {
      return this
    }
  }
}

export default WithEventStore
