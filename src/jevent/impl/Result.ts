import { Observable, of } from 'rxjs'
import JEvent, { BaseConstructor, Result, ResultEntry, ResultResult } from '../JEvent'

const WithResult = <TBase extends BaseConstructor>(Base: TBase) => {
  return class extends Base implements Result {
    withResult(resultToAdd: ResultResult): Observable<ResultEntry> {
      return of({
        result: resultToAdd,
        // hacky but makes life so much easier by not having the user
        // to pass event each time this method is called :)
        event: this as unknown as JEvent,
      })
    }
  }
}

export default WithResult
