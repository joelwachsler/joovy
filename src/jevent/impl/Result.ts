import { Constructor, Result } from '../JEvent'

const WithResult = <TBase extends Constructor>(Base: TBase) => {
  return class extends Base implements Result {
    private _result: any[] = []

    get result() {
      return this._result
    }

    /**
     * Needed to prevent jest matcher errors.
     */
    set result(result: any[]) {
      this._result = result
    }

    withResult(resultToAdd: any) {
      this.result.push(resultToAdd)
      return this
    }
  }
}

export default WithResult
