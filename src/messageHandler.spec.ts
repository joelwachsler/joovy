import { TestScheduler } from 'rxjs/testing'
import { Environment } from './Environment'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import { Store } from './Store'

export const createScheduler = () => {
  return new TestScheduler((actual, expected) => expect(actual).toEqual(expected))
}

const createTestMessage = (input?: Partial<JMessage>): Environment => {
  const message: JMessage = {
    author: {
      bot: false,
      id: 'testAuthorId',
    },
    channelId: 'testChannelId',
    content: 'testContent',
    ...input,
  }

  return {
    message,
    store: Store.getOrCreateInMemoryStore(message),
  }
}

test('should ignore bot messages', () =>  {
  const scheduler = createScheduler()
  scheduler.run(({ expectObservable, hot }) => {

    const message = createTestMessage({
      author: {
        bot: true,
        id: '/test',
      },
    })

    const source$ = hot<Environment>('a-', { a: message })
    expectObservable(handleMessage(source$)).toBe('--')
  })
})

test('should ignore messages not starting with a slash', () =>  {
  const scheduler = createScheduler()
  scheduler.run(({ expectObservable, hot }) => {

    const message = createTestMessage({
      author: {
        bot: false,
        id: 'test',
      },
    })

    const source$ = hot<Environment>('a-', { a: message })
    expectObservable(handleMessage(source$)).toBe('--')
  })
})
