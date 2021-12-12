import { Observable, of } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import JEvent, { WithResult, WithStore } from './JEvent'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import Player, { Track } from './player/Player'

export const createScheduler = () => {
  return new TestScheduler((actual, expected) => expect(actual).toMatchObject(expected))
}

const scheduler = createScheduler()

const createTestEvent = (input?: Partial<JMessage>): JEvent => {
  class PlayerFake implements Player {
    play(_: Track): Observable<void> {
      throw new Error('Method not implemented.')
    }

    disconnect(): void {
      throw new Error('Method not implemented.')
    }
  }

  class EventFakeBase {
    get message() {
      return {
        author: {
          bot: false,
          id: 'testAuthorId',
        },
        channelId: 'testChannelId',
        content: 'testContent',
        ...input,
      }
    }

    get factory() {
      return {
        player: of(new PlayerFake()),
      }
    }
  }

  return new class EventFake extends WithStore(WithResult(EventFakeBase)) { }
}

test('should ignore bot messages', () =>  {
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      author: {
        bot: true,
        id: 'testAuthorId',
      },
      content: '/test',
    })

    const source$ = hot<JEvent>('a', { a: event })
    expectObservable(handleMessage(source$)).toBe('r', {
      r: {
        result: [
          { ignored: '/test was sent by a bot' },
        ],
      },
    })
  })
})

test('should ignore messages not starting with a slash', () => {
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: 'test',
    })

    const source$ = hot<JEvent>('a', { a: event })
    expectObservable(handleMessage(source$)).toBe('r', {
      r: {
        result: [
          { ignored: 'test does not start with a slash' },
        ],
      },
    })
  })
})

test('should join channel if not previously joined', () => {
  scheduler.run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: '/play test',
    })

    const source$ = hot<JEvent>('a', { a: event })
    expectObservable(handleMessage(source$)).toBe('r', {
      r: {
        result: [
          { player: { joined: 'testing' } },
        ],
      },
    })
  })
})
