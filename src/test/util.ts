import { MessageEmbed } from 'discord.js'
import { rxSandbox, RxSandboxInstance } from 'rx-sandbox'
import { delay, map, Observable, of } from 'rxjs'
import JEvent from '../jevent/JEvent'
import { WithBaseFunctionality } from '../jevent/mixin/BaseFunctionality'
import { sendMessage } from '../jevent/mixin/SendMessage'
import { Result } from '../jevent/Result'
import { YtSearchResult } from '../jevent/YtSearchResult'
import { JMessage } from '../JMessage'
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

export const createTestEvent = (input?: Partial<JMessage>): JEvent => {
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
        ytSearch(query: string): Observable<YtSearchResult> {
          return of({
            url: `https://${query}.com`,
            title: `${query}`,
            timestamp: '1:10',
          })
        },
      }
    }

    sendMessage(message: string | MessageEmbed): Observable<Result> {
      return sendMessage({
        message,
        event: this as unknown as JEvent,
        messageSender: _ => of(undefined),
        indent: 12,
      })
    }
  }
}
