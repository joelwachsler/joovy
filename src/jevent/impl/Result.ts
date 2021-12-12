import { concat, Observable, of } from 'rxjs'
import JEvent, { BaseConstructor, Result, ResultEntry, ResultResult } from '../JEvent'

const WithResult = <TBase extends BaseConstructor>(Base: TBase) => {
  return class extends Base implements Result {
    withResult(resultToAdd: ResultResult, ...andThen: Observable<ResultEntry>[]): Observable<ResultEntry> {
      return andThen.reduce(
        (acc, curr) => concat(acc, curr),
        of({
          result: resultToAdd,
          // TODO: make this type safe
          event: this as unknown as JEvent,
        }),
      )
    }
  }
}

export default WithResult
