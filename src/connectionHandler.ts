import { Message, MessageEmbed } from 'discord.js'
import { catchError, filter, map, Observable, share, Subject } from 'rxjs'
import { Pool } from 'threads'
import * as Command from './command/command'
import { initEnvironment } from './environment'
import { logger } from './logger'
import { MsgEvent } from './main'
import { ObservablePlaylist } from './observablePlaylist'
import { Player } from './player'

export interface QueueTrack {
  name: string
  link: string
  message: Message
  skipped?: boolean
}

export type SendMessage = (msg: MsgType) => Promise<void>

export type MsgType = string | MessageEmbed | MessageWithReactions
interface SendMessageArgs {
  msg: MsgType
  message: Message
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
        throw new ErrorWithMessage('Could not determine which channel you are in, have you joined one?', v.message)
      }
      return {
        ...v,
        channelId,
      }
    }),
    catchError((e, caught) => {
      if (e instanceof ErrorWithMessage) {
        sendMessage({
          msg: e.errorMsg,
          message: e.message,
        })
      } else {
        logger.error(`Caught an error: "${e}"`)
      }
      return caught
    }),
    share(),
  ).subscribe(async v => {
    if (!msgObservers.has(v.channelId)) {
      const subject = new Subject<MsgEvent>()
      msgObservers.set(v.channelId, subject)
      logger.info(`Initializing new observer for: ${v.channelId}`)
      await initCmdObserver(v.message, v.pool, subject, () => msgObservers.delete(v.channelId))
    }

    msgObservers.get(v.channelId)!.next(v)
  })
}

const initCmdObserver = async (
  message: Message,
  pool: Pool<any>,
  channelObserver: Subject<MsgEvent>,
  unsubscribe: () => void,
) => {
  const channelObserverWithMsg = channelObserver
    .pipe(map(v => ({ ...v, content: v.message.content })))

  const env = initEnvironment()

  env.sendMessage.subscribe(async msg => sendMessage({ msg, message })
    .then(async sentMsg => {
      if (sentMsg.embeds[0].title?.startsWith('Queue')) {
        env.reprintQueueOnReaction.next(sentMsg)
      }
    }))

  env.editMessage.subscribe(async editedMessage => editMessage(editedMessage)
    .then(async editedMsg => {
      if (editedMsg.embeds[0].title?.startsWith('Queue')) {
        env.reprintQueueOnReaction.next(editedMsg)
      }
    }))

  ObservablePlaylist.init(env)
  await Player.init({ message, env })

  env.addTrackToQueue.subscribe(({ name }) => {
    env.sendMessage.next(`${name} has been added to the queue.`)
  })

  env.addNextTrackToQueue.subscribe(({ name }) => {
    env.sendMessage.next(`${name} will be played next.`)
  })

  const commands = Command.init(env, pool)

  const observer = channelObserverWithMsg.subscribe({
    next: async v => {
      await commands.handleMessage(v.message)
    },
  })

  env.disconnect.subscribe(_ => {
    env.sendMessage.next('Bye!')
    Object.values(env).forEach(envValue => {
      if (envValue instanceof Subject) {
        envValue.complete()
      }
    })
    observer.unsubscribe()
    channelObserver.complete()
    unsubscribe()
  })
}

export class EditedMessage {
  constructor(public prevMessage: Message, public newMessage: MessageWithReactions) { }
}

export class MessageWithReactions {
  constructor(public embeded: MessageEmbed, public reactions: string[]) { }
}

class ErrorWithMessage {
  constructor(public errorMsg: string, public message: Message) { }
}

const sendMessage = async ({ msg, message }: SendMessageArgs) => {
  if (typeof msg === 'string') {
    const embed = new MessageEmbed().setDescription(msg)
    return await message.channel.send({
      embeds: [embed]
    })
  } else if (msg instanceof MessageWithReactions) {
    const sentMsg = await message.channel.send({
      embeds: [msg.embeded]
    })
    if (msg.reactions.length > 0) {
      const react = sentMsg.react(msg.reactions[0])
      msg.reactions.slice(1).forEach(r => react.then(() => sentMsg.react(r)))
    }
    return sentMsg
  } else {
    return await message.channel.send({
      embeds: [msg]
    })
  }
}

const editMessage = async (editedMessage: EditedMessage) => {
  const newMsg = editedMessage.newMessage
  const editedMsg = await editedMessage.prevMessage.edit({
    embeds: [newMsg.embeded]
  })

  editedMsg.reactions.removeAll()
    .catch(error => console.error('Failed to clear reactions:', error))

  if (newMsg.reactions.length > 0) {
    for (const reaction of newMsg.reactions) {
      await editedMsg.react(reaction)
    }
  }

  return editedMsg
}

