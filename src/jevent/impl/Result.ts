import { concat, Observable, of } from 'rxjs'
import JEvent, { BaseConstructor, EmptyResult, Result, ResultArg, ResultEntry, ResultResult } from '../JEvent'

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

    empty(): Observable<EmptyResult> {
      return of(new EmptyResult(this as unknown as JEvent))
    }
  }
}

export default WithResult
