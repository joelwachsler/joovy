import { Message, MessageEmbed } from 'discord.js'
import { catchError, filter, map, Observable, share, Subject } from 'rxjs'
import { Command } from './command/command'
import { destroyEnv, initEnvironment } from './environment'
import { logger } from './logger'
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

export const initMsgHandler = (msgObservable: Observable<Message>) => {
  const msgObservers = new Map<string, Subject<Message>>()
  msgObservable.pipe(
    // Ignore bot messages
    filter(message => !message.author.bot),
    // Only process messages starting with a slash
    filter(message => message.content.startsWith('/')),
    map(message => {
      const channelId = message.member?.voice.channel?.id
      if (!channelId) {
        throw new ErrorWithMessage('Could not determine which channel you are in, have you joined one?', message)
      }

      return {
        message,
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
  ).subscribe(({ message, channelId }) => {
    if (!msgObservers.has(channelId)) {
      const subject = new Subject<Message>()
      msgObservers.set(channelId, subject)
      logger.info(`Initializing new observer for: ${channelId}`)
      initCmdObserver(message, subject, () => msgObservers.delete(channelId))
    }

    msgObservers.get(message.channelId)!.next(message)
  })
}

const initCmdObserver = (
  initialMessage: Message,
  channelObserver$: Subject<Message>,
  unsubscribe: () => void,
) => {
  const env = initEnvironment()

  env.sendMessage.subscribe(async msg => sendMessage({ msg, message: initialMessage })
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
  Player.init({ message: initialMessage, env })

  env.addTrackToQueue.subscribe(({ name }) => {
    env.sendMessage.next(`${name} has been added to the queue.`)
  })

  env.addNextTrackToQueue.subscribe(({ name }) => {
    env.sendMessage.next(`${name} will be played next.`)
  })

  Command.init(env, channelObserver$)

  env.disconnect.subscribe(_ => {
    env.sendMessage.next('Bye!')
    destroyEnv(env)
    channelObserver$.complete()
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

