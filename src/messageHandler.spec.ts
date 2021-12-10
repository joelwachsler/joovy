import { TestScheduler } from 'rxjs/testing'
import { Event } from './Event'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import { Store } from './Store'

export const createScheduler = () => {
  return new TestScheduler((actual, expected) => expect(actual).toEqual(expected))
}

const createTestEvent = (input?: Partial<JMessage>): Event => {
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
    store: {
      string: Store.getOrCreateInMemoryStore(message),
      object: Store.getOrCreateInMemoryStore(message),
    }
  }
}

test('should ignore bot messages', () =>  {
  const scheduler = createScheduler()
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      author: {
        bot: true,
        id: '/test',
      },
    })

    const source$ = hot<Event>('a-', { a: event })
    expectObservable(handleMessage(source$)).toBe('--')
  })
})

test('should ignore messages not starting with a slash', () =>  {
  const scheduler = createScheduler()
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      author: {
        bot: false,
        id: 'test',
      },
    })

    const source$ = hot<Event>('a-', { a: event })
    expectObservable(handleMessage(source$)).toBe('--')
  })
})

test('should join channel if not previously joined', () =>  {
  const scheduler = createScheduler()
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      author: {
        bot: false,
        id: '/play test',
      },
    })

    const source$ = hot<Event>('a-----', { a: event })
    expectObservable(handleMessage(source$)).toBe('a-----', { a: { player: { joined: 'testChannelId' } } })
  })
})
