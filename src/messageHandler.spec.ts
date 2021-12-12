import { MessageEmbed } from 'discord.js'
import { rxSandbox, RxSandboxInstance } from 'rx-sandbox'
import { Observable, of } from 'rxjs'
import JEvent, { ResultEntry, WithBaseFunctionality } from './jevent/JEvent'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import Player, { Track } from './player/Player'

let sandbox: RxSandboxInstance
let e: RxSandboxInstance['e']
let hot: RxSandboxInstance['hot']

beforeEach(() => {
  sandbox = rxSandbox.create(true)
  e = sandbox.e
  hot = sandbox.hot
})

const handle = (source$: Observable<any>) => sandbox.getMessages(handleMessage(source$))

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

    sendMessage(event: JEvent, message: string | MessageEmbed): Observable<ResultEntry> {
      if (message instanceof MessageEmbed) {
        return event.withResult({ messageSent: `${message.toJSON()}` })
      } else {
        return event.withResult({ messageSent: message })
      }
    }
  }
}

it('should ignore bot messages', () =>  {
  const event = createTestEvent({
    author: {
      bot: true,
      id: 'testAuthorId',
    },
    content: '/test',
  })

  const messages$ = hot('a|', { a: event })
  expect(handle(messages$)).toMatchObject(e('a|', {
    a: {
      result: {
        ignored: '/test was sent by a bot',
      },
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
      result: {
        ignored: 'test does not start with a slash',
      },
    },
  }))
})

it('should join channel if not previously joined', () => {
  const event = createTestEvent({
    content: '/play test',
  })

  const messages = handle(hot('a|', { a: event }))
  expect(messages).toMatchObject(e('(ab)|', {
    a: {
      result: {
        commandCalled: '/play',
      },
    },
    b: {
      result: {
        player: 'joined',
      },
    },
  }))
})

it('invalid command should call help', () => {
  const event = createTestEvent({
    content: '/invalid command',
  })

  const messages = handle(hot('a|', { a: event }))
  expect(messages).toMatchObject(e('(ab)|', {
    a: {
      result: {
        invalidCommand: '/invalid command',
      },
    },
    b: {
      result: {
        help: true,
      },
    },
  }))
})

it('disconnect should disconnect if connected to channel', () => {
  const join = createTestEvent({
    content: '/play test',
  })
  const disconnect = createTestEvent({
    content: '/disconnect',
  })

  const messages = handle(hot('ab|', { a: join, b: disconnect }))
  expect(messages).toMatchObject(e('(ab)(cd)|', {
    a: {
      result: {
        commandCalled: '/play',
      },
    },
    b: {
      result: {
        player: 'joined',
      },
    },
    c: {
      result: {
        commandCalled: '/disconnect',
      },
    },
    d: {
      result: {
        messageSent: 'Bye!',
      },
    },
  }))
})

test.todo('disconnect should not do anything if not connected to channel')
