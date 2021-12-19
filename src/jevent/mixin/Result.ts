import { concat, Observable, of } from 'rxjs'
import JEvent, { BaseConstructor } from '../JEvent'
import { EmptyResult, Result, ResultArg, ResultFactory, ResultResult } from '../Result'

const WithResult = <TBase extends BaseConstructor>(Base: TBase) => {
  return class extends Base implements ResultFactory {
    result(result: ResultResult, ...andThen: Observable<Result>[]): Observable<Result> {
      return this.complexResult({ result, item: undefined }, ...andThen)
    }

    complexResult<T = undefined>(arg: ResultArg<T>, ...andThen: Observable<Result<any>>[]): Observable<Result<T>> {
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
