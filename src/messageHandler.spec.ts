import { MessageEmbed } from 'discord.js'
import { rxSandbox, RxSandboxInstance } from 'rx-sandbox'
import { map, Observable, of } from 'rxjs'
import JEvent, { ResultEntry, WithBaseFunctionality } from './jevent/JEvent'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import Player, { Track } from './player/Player'

let sandbox: RxSandboxInstance
let e: RxSandboxInstance['e']
let hot: RxSandboxInstance['hot']
let store: Map<string, unknown>

beforeEach(() => {
  sandbox = rxSandbox.create(true)
  e = sandbox.e
  hot = sandbox.hot
  store = new Map()
})

const handle = (source$: Observable<any>) => sandbox.getMessages(handleMessage(source$).pipe(map(r => r.result)))

const createTestEvent = (input?: Partial<JMessage>): JEvent => {
  class PlayerFake implements Player {
    play(_: Track): Observable<void> {
      return of(undefined)
    }

    disconnect(): void {
      return undefined
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

  return new class EventFake extends WithBaseFunctionality(message, () => store) {
    get factory() {
      return {
        player: of(new PlayerFake()),
      }
    }

    sendMessage(message: string | MessageEmbed): Observable<ResultEntry> {
      const event = this as unknown as JEvent

      if (message instanceof MessageEmbed) {
        return event.result({ messageSent: `${message.toJSON()}` })
      } else {
        return event.result({ messageSent: message })
      }
    }
  }
}

describe('message filtering', () => {
  it('should ignore bot messages', () =>  {
    const event = createTestEvent({
      author: {
        bot: true,
        id: 'testAuthorId',
      },
      content: '/test',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchObject(e('a|', {
      a: {
        ignored: '/test was sent by a bot',
      },
    }))
  })

  it('should ignore messages not starting with a slash', () => {
    const event = createTestEvent({
      content: 'test',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchObject(e('a|', {
      a: {
        ignored: 'test does not start with a slash',
      },
    }))
  })
})

describe('player creation', () => {
  it('should create player if not previously created', () => {
    const event = createTestEvent({
      content: '/play test',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchObject(e('(abc)|', {
      a: {
        commandCalled: '/play',
      },
      b: {
        player: 'created',
      },
      c: {
        playing: { name: '/play test', link: 'test' },
      },
    }))
  })

  it('should not create player if previously created', () => {
    const play = createTestEvent({
      content: '/play test',
    })

    const playAgain = createTestEvent({
      content: '/play test2',
    })

    const messages = handle(hot('ab|', { a: play, b: playAgain }))
    expect(messages).toMatchObject(e('(abc)(ade)|', {
      a: {
        commandCalled: '/play',
      },
      b: {
        player: 'created',
      },
      c: {
        playing: { name: '/play test', link: 'test' },
      },
      d: {
        player: 'found',
      },
      e: {
        playing: { name: '/play test2', link: 'test2' },
      },
    }))
  })
})

describe('misc commands', () => {
  it('invalid command should call help', () => {
    const event = createTestEvent({
      content: '/invalid command',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchObject(e('(ab)|', {
      a: {
        invalidCommand: '/invalid command',
      },
      b: {
        help: true,
      },
    }))
  })
})

describe('disconnection', () => {
  it('disconnect should disconnect if connected to channel', () => {
    const play = createTestEvent({
      content: '/play test',
    })
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('ab|', { a: play, b: disconnect }))
    expect(messages).toMatchObject(e('(abc)(defg)|', {
      a: {
        commandCalled: '/play',
      },
      b: {
        player: 'created',
      },
      c: {
        playing: { name: '/play test', link: 'test' },
      },
      d: {
        commandCalled: '/disconnect',
      },
      e: {
        player: 'disconnected',
      },
      f: {
        player: 'removed',
      },
      g: {
        messageSent: 'Bye!',
      },
    }))
  })

  test('disconnect should not do anything if not connected to channel', () => {
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('a|', { a: disconnect }))
    expect(messages).toMatchObject(e('a|', {
      a: {
        commandCalled: '/disconnect',
      },
    }))
  })
})
