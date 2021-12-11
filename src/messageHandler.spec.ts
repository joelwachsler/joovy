import { defer, Observable, of } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import { Event } from './Event'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import { Player } from './player/Player'
import { Store } from './Store'

export const createScheduler = () => {
  return new TestScheduler((actual, expected) => expect(actual).toMatchObject(expected))
}

const scheduler = createScheduler()

class PlayerFake implements Player {

  play(track: Player.Track): Observable<void> {
    throw new Error('Method not implemented.')
  }

  disconnect(): void {
    throw new Error('Method not implemented.')
  }
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

  return Event.withResult({
    message,
    factory:  {
      player: of(new PlayerFake()),
    },
    store: {
      string: Store.getOrCreateInMemoryStore(message),
      object: Store.getOrCreateInMemoryStore(message),
    }
  })
}

test('should ignore bot messages', () =>  {
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      author: {
        bot: true,
        id: 'testAuthorId',
      },
      content: '/test'
    })

    const source$ = hot<Event>('a', { a: event })
    expectObservable(handleMessage(source$)).toBe('r', { r: { result: { ignored: '/test was sent by a bot' } } })
  })
})

test('should ignore messages not starting with a slash', () =>  {
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: 'test',
    })

    const source$ = hot<Event>('a', { a: event })
    expectObservable(handleMessage(source$)).toBe('r', { r: { result: { ignored: 'test does not start with a slash' } } })
  })
})

test('should join channel if not previously joined', () =>  {
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: '/play test'
    })

    const source$ = hot<Event>('a', { a: event })
    expectObservable(handleMessage(source$)).toBe('r', { r: { result: { player: { joined: 'testing' } } } })
  })
})
