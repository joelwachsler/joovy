import { concat, Observable, of } from 'rxjs'
import JEvent, { BaseConstructor, Result, ResultArg, ResultEntry, ResultResult } from '../JEvent'

const WithResult = <TBase extends BaseConstructor>(Base: TBase) => {
  return class extends Base implements Result {
    result(result: ResultResult, ...andThen: Observable<ResultEntry>[]): Observable<ResultEntry> {
      return this.complexResult({ result, item: undefined }, ...andThen)
    }

    complexResult<T = undefined>(arg: ResultArg<T>, ...andThen: Observable<ResultEntry<any>>[]): Observable<ResultEntry<T>> {
      return andThen.reduce(
        (acc, curr) => concat(acc, curr),
        of({
          ...arg,
          // TODO: make this type safe
          event: this as unknown as JEvent,
        }),
      )
    }
  }
}

export default WithResult
