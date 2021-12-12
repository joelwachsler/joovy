import { MessageEmbed } from 'discord.js'
import { Observable, of } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
import JEvent, { WithBaseFunctionality } from './jevent/JEvent'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import Player, { Track } from './player/Player'

const scheduler = () => {
  return new TestScheduler((actual, expected) => expect(actual).toMatchObject(expected))
}

const createTestEvent = (input?: Partial<JMessage>): JEvent => {
  class PlayerFake implements Player {
    play(_: Track): Observable<void> {
      throw new Error('Method not implemented.')
    }

    disconnect(): void {
      throw new Error('Method not implemented.')
    }
  }

  const message: JMessage = {
    author: {
      bot: false,
      id: 'testAuthorId',
    },
    channelId: 'testChannelId',
    content: 'testContent',
    ...input,
  }

  return new class EventFake extends WithBaseFunctionality(message) {
    get factory() {
      return {
        player: of(new PlayerFake()),
      }
    }

    sendMessage(event: JEvent, message: string | MessageEmbed): Observable<JMessage> {
      if (message instanceof MessageEmbed) {
        return of(event.message)
      } else {
        return of(event.message)
      }
    }
  }
}

test('should ignore bot messages', () =>  {
  scheduler().run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      author: {
        bot: true,
        id: 'testAuthorId',
      },
      content: '/test',
    })

    const source$ = hot<JEvent>('a|', { a: event })
    expectObservable(handleMessage(source$)).toBe('0|', [
      {
        result: {
          ignored: '/test was sent by a bot',
        },
      },
    ])
  })
})

test('should ignore messages not starting with a slash', () => {
  scheduler().run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: 'test',
    })

    const source$ = hot<JEvent>('a|', { a: event })
    expectObservable(handleMessage(source$)).toBe('0|', [
      {
        result: {
          ignored: 'test does not start with a slash',
        },
      },
    ])
  })
})

test('should join channel if not previously joined', () => {
  scheduler().run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: '/play test',
    })

    const source$ = hot<JEvent>('(a|)', { a: event })
    expectObservable(handleMessage(source$)).toBe('(0-1|)', [
      {
        result: {
          commandCalled: '/play',
        },
      },
      {
        result: {
          player: 'joined',
        },
      },
    ])
  })
})

test('invalid command should call help', () => {
  scheduler().run(({ expectObservable, hot }) => {
    const event = createTestEvent({
      content: '/invalid command',
    })

    const source$ = hot<JEvent>('(a|)', { a: event })
    expectObservable(handleMessage(source$)).toBe('(0-1|)', [
      {
        result: {
          invalidCommand: '/invalid command',
        },
      },
      {
        result: {
          help: true,
        },
      },
    ])
  })
})
