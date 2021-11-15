import { TestScheduler } from 'rxjs/testing'
import { destroyEnv, Environment, initEnvironment } from '../environment'
import { runQueryFake } from '../ytquery/impl/Fake'
import { YtQuery } from '../ytquery/YtQuery'

/**
 * Varius utils to make testing easier.
 */
export namespace TestUtil {
  export const createScheduler = () => {
    return new TestScheduler((actual, expected) => expect(actual).toEqual(expected))
  }

  interface TestArgs {
    env: Environment
    scheduler: ReturnType<typeof createScheduler>
  }

  export const setupTest = (test: (args: TestArgs) => void) => {
    const env = initEnvironment()
    YtQuery.runQuery = runQueryFake
    test({
      env,
      scheduler: createScheduler(),
    })
    destroyEnv(env)
  }
}
