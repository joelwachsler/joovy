import { MessageEmbed } from 'discord.js'
import { rxSandbox, RxSandboxInstance } from 'rx-sandbox'
import { defer, delay, map, Observable, ObservableInput, of, timeout } from 'rxjs'
import { TimeoutConfig, TimeoutInfo } from 'rxjs/internal/operators/timeout'
import JEvent from '../jevent/JEvent'
import { WithBaseFunctionality } from '../jevent/mixin/BaseFunctionality'
import { sendMessage } from '../jevent/mixin/SendMessage'
import { Result } from '../jevent/Result'
import { YtSearchResult } from '../jevent/YtSearchResult'
import JMessage, { JReaction, MessageContent } from '../JMessage'
import { handleMessage } from '../messageHandler'
import Player from '../player/Player'
import { PlayerFake } from './PlayerFake'

export let sandbox: RxSandboxInstance
export let e: RxSandboxInstance['e']
export let hot: RxSandboxInstance['hot']
export let store: Map<string, unknown>
export let player: Player
export const date = new Date(2000, 1, 1)

beforeEach(() => {
  sandbox = rxSandbox.create(true)
  e = sandbox.e
  hot = sandbox.hot
  store = new Map()
  player = new PlayerFake(sandbox.scheduler)
})

export const handle = (source$: Observable<any>) => sandbox.getMessages(handleMessage(source$).pipe(map(r => r.result)))

class JMessageFake implements JMessage {

  channelId: string
  author: JMessage['author']
  content: string
  reactions: string[] = []

  constructor(input?: Partial<JMessage>) {
    this.channelId = input?.channelId ?? 'testChannelId'
    const defaultAuthor = {
      username: 'testuser',
      bot: false,
      id: 'testAuthorId',
    }
    this.author = input?.author ?? defaultAuthor
    this.content = input?.content ?? 'testContent'
  }

  get clearReactions$(): Observable<JMessage> {
    return defer(() => {
      this.reactions = []
      return of(this)
    })
  }

  get reactions$(): Observable<JReaction> {
    return of()
  }

  edit(_: MessageContent): Observable<JMessage> {
    return of(this)
  }

  react(reaction: string): Observable<JMessage> {
    return defer(() => {
      this.reactions.push(reaction)
      return of(this)
    })
  }

  send(_: MessageContent): Observable<JMessage> {
    return of(this)
  }
}

export const createTestEvent = (input?: Partial<JMessage>): JEvent => {
  const message = new JMessageFake(input)
  return new class EventFake extends WithBaseFunctionality(message, () => store, date.getTime()) {
    get factory() {
      return {
        player: of(player),
        delay: <T>(ms: number) => delay<T>(ms, sandbox.scheduler),
        timeout: <T, O extends ObservableInput<any>, M>(
          config: TimeoutConfig<T, O, M> & { with: (info: TimeoutInfo<T, M>) => O },
        ) => timeout<T, O, M>({ ...config, scheduler: sandbox.scheduler }),
        ytSearch(query: string): Observable<YtSearchResult> {
          return of({
            url: `https://${query}.com`,
            title: `${query}`,
            timestamp: '1:10',
          })
        },
      }
    }

    sendMessage(messageToSend: string | MessageEmbed): Observable<Result> {
      return sendMessage({
        message: messageToSend,
        event: this as unknown as JEvent,
        messageSender: _ => of(message),
        indent: 2,
      })
    }
  }
}
