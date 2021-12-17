import { MessageEmbed } from 'discord.js'
import { rxSandbox, RxSandboxInstance } from 'rx-sandbox'
import { delay, map, Observable, of, SchedulerLike, Subject } from 'rxjs'
import { sendMessage } from './jevent/impl/SendMessage'
import JEvent, { ResultEntry, WithBaseFunctionality } from './jevent/JEvent'
import { JMessage } from './JMessage'
import { handleMessage } from './messageHandler'
import Player, { Track } from './player/Player'

let sandbox: RxSandboxInstance
let e: RxSandboxInstance['e']
let hot: RxSandboxInstance['hot']
let store: Map<string, unknown>
let player: Player
const date = new Date(2000, 1, 1)

beforeEach(() => {
  sandbox = rxSandbox.create(true)
  e = sandbox.e
  hot = sandbox.hot
  store = new Map()
  player = new PlayerFake(sandbox.scheduler)
})

const handle = (source$: Observable<any>) => sandbox.getMessages(handleMessage(source$).pipe(map(r => r.result)))

class PlayerFake implements Player {
  private playing = new Subject<Track>()

  constructor(private scheduler: SchedulerLike) { }

  idle(): Observable<void> {
    return of(undefined).pipe(
      delay(5, this.scheduler),
    )
  }

  play(track: Track): Observable<Track> {
    this.playing.next(track)
    return of(track)
  }

  disconnect(): void {
    return undefined
  }
}

const createTestEvent = (input?: Partial<JMessage>): JEvent => {
  const message: JMessage = {
    author: {
      username: 'testuser',
      bot: false,
      id: 'testAuthorId',
    },
    channelId: 'testChannelId',
    content: 'testContent',
    ...input,
  }

  return new class EventFake extends WithBaseFunctionality(message, () => store, date.getTime()) {
    get factory() {
      return {
        player: of(player),
        delay: <T>(ms: number) => delay<T>(ms, sandbox.scheduler),
      }
    }

    sendMessage(message: string | MessageEmbed): Observable<ResultEntry> {
      return sendMessage({
        message,
        event: this as unknown as JEvent,
        messageSender: _ => of(undefined),
        indent: 12,
      })
    }
  }
}

describe('message filtering', () => {
  it('should ignore bot messages', () =>  {
    const event = createTestEvent({
      author: {
        username: 'testuser',
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
    expect(messages).toMatchSnapshot()
  })

  it('should not create player if previously created', () => {
    const play = createTestEvent({
      content: '/play test',
    })

    const playAgain = createTestEvent({
      content: '/play test2',
    })

    const messages = handle(hot('ab|', { a: play, b: playAgain }))
    expect(messages).toMatchSnapshot()
  })
})

describe('misc commands', () => {
  it('invalid command should call help', () => {
    const event = createTestEvent({
      content: '/invalid command',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchSnapshot()
  })
})

describe('disconnection', () => {
  it('should disconnect if connected to channel', () => {
    const play = createTestEvent({
      content: '/play test',
    })
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('ab|', { a: play, b: disconnect }))
    expect(messages).toMatchSnapshot()
  })

  it('should disconnect, reconnect and disconnect again without any problem', () => {
    const play = createTestEvent({
      content: '/play test',
    })
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('aba|', { a: play, b: disconnect }))
    expect(messages).toMatchSnapshot()
  })

  it('should not do anything if not connected to channel', () => {
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('a', { a: disconnect }))
    expect(messages).toMatchObject(e('a', {
      a: {
        commandCalled: '/disconnect',
      },
    }))
  })
})

describe('playlist', () => {
  it('should queue song if another one is already playing', () => {
    const play = createTestEvent({ content: '/play test' })
    const playAgain = createTestEvent({ content: '/play test2' })
    const playAgainAgain = createTestEvent({ content: '/play test3' })

    const messages = handle(hot('abc', { a: play, b: playAgain, c: playAgainAgain }))
    expect(messages).toMatchSnapshot()
  })

  it('should print queue with no tracks', () => {
    const queue = createTestEvent({ content: '/queue' })

    const messages = handle(hot('a', { a: queue }))
    expect(messages).toMatchSnapshot()
  })

  it('should print queue', () => {
    const play = createTestEvent({ content: '/play test' })
    const queue = createTestEvent({ content: '/queue' })

    const messages = handle(hot('ab', { a: play, b: queue }))
    expect(messages).toMatchSnapshot()
  })

  it('should print queue with multiple tracks', () => {
    const play = createTestEvent({ content: '/play test' })
    const playAnotherTrack = createTestEvent({ content: '/play test2' })
    const queue = createTestEvent({ content: '/queue' })

    const messages = handle(hot('abc', { a: play, b: playAnotherTrack, c: queue }))
    expect(messages).toMatchSnapshot()
  })
})
