import { Message, MessageEmbed } from 'discord.js'
import { catchError, EMPTY, filter, map, Observable, share, Subject } from 'rxjs'
import { logger } from './logger'
import { MsgEvent } from './main'
import { ObservablePlaylist } from './observablePlaylist'
import { Player } from './player'
import { QueryResolver } from './queryResolver'

export interface QueueItem {
  name: string
  link: string
  message: Message
  skipped?: boolean
}

export type SendMessage = (msg: MsgType) => Promise<void>

type MsgType = string | MessageEmbed
interface SendMessageArgs {
  msg: MsgType
  message: Message
}

const sendMessage = async ({ msg, message }: SendMessageArgs) => {
  if (typeof msg === 'string') {
    const embed = new MessageEmbed().setDescription(msg)
    await message.channel.send(embed)
  } else {
    await message.channel.send(msg)
  }
}

export const initMsgHandler = (msgObservable: Observable<MsgEvent>) => {
  const msgObservers = new Map<string, Subject<MsgEvent>>()
  msgObservable.pipe(
    // Ignore bot messages
    filter(v => !v.message.author.bot),
    // Only process messages starting with a slash
    filter(v => v.message.content.startsWith('/')),
    map(v => {
      const channelId = v.message.member?.voice.channel?.id
      if (!channelId) {
        throw new ErrorWithMessage('Could not determine channel id, are you joined to a voice channel?', v.message)
      }
      return {
        ...v,
        channelId,
      }
    }),
    catchError(e => {
      if (e instanceof ErrorWithMessage) {
        sendMessage({
          msg: e.errorMsg,
          message: e.message,
        })
      } else {
        logger.error(`Caught an error: "${e}"`)
      }
      return EMPTY
    }),
    share(),
  ).subscribe(async v => {
    if (!msgObservers.has(v.channelId)) {
      const subject = new Subject<MsgEvent>()
      msgObservers.set(v.channelId, subject)
      logger.info(`Initializing new observer for: ${v.channelId}`)
      await initCmdObserver(v.message, subject, () => msgObservers.delete(v.channelId))
    }

    msgObservers.get(v.channelId)!.next(v)
  },
  )
}

export interface Environment {
  sendMessage: Subject<string>
  currentlyPlaying: Subject<ObservablePlaylist.Item>
  nextItemInPlaylist: Subject<ObservablePlaylist.Item | null>
  addItemToQueue: Subject<Omit<ObservablePlaylist.Item, 'index'>>
  printQueueRequest: Subject<any>
}

const initCmdObserver = async (
  message: Message,
  channelObserver: Subject<MsgEvent>,
  unsubscribe: () => void,
) => {
  const channelObserverWithMsg = channelObserver
    .pipe(map(v => ({ ...v, content: v.message.content })))

  const env: Environment = {
    sendMessage: new Subject(),
    currentlyPlaying: new Subject(),
    nextItemInPlaylist: new Subject(),
    addItemToQueue: new Subject(),
    printQueueRequest: new Subject(),
  }

  env.sendMessage.subscribe(msg => {
    sendMessage({
      message,
      msg,
    })
  })

  ObservablePlaylist.init(env)
  await Player.init({ message, env })

  env.addItemToQueue.subscribe(({ name }) => {
    env.sendMessage.next(`${name} has been added to the queue.`)
  })

  env.currentlyPlaying.subscribe(({ name }) => {
    env.sendMessage.next(`Now playing: ${name}`)
  })

  const observer = channelObserverWithMsg.subscribe({
    next: async v => {
      const { content, message, pool } = v
      if (content.startsWith('/play')) {
        const newItem = await QueryResolver.resolveQuery({ message, pool })
        if (newItem) {
          env.addItemToQueue.next(newItem)
        } else {
          env.sendMessage.next(`Unable to find result for: ${content}`)
        }
      } else if (content === '/skip') {
        env.nextItemInPlaylist.next(null)
      } else if (content === '/queue') {
        env.printQueueRequest.next(null)
      } else if (content === '/disconnect') {
        env.sendMessage.next('Bye!')
        Object.values(env).forEach(envValue => {
          if (envValue instanceof Subject) {
            envValue.complete()
          }
        })
        observer.unsubscribe()
        unsubscribe()
      } else {
        env.sendMessage.next(`Unknown command: "${content}"`)
      }
    },
  })
}

class ErrorWithMessage {
  constructor(public errorMsg: string, public message: Message) { }
}
