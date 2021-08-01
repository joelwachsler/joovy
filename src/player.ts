import { Message, StreamDispatcher } from 'discord.js'
import { Readable } from 'stream'
import ytdl from 'ytdl-core'
import { Environment } from './connectionHandler'
import { logger } from './logger'

export namespace Player {
  export const init = async ({ message, env }: InitArgs) => {
    const voiceChannel = message.member?.voice.channel
    logger.info(`Joining channel: ${voiceChannel?.id}...`)
    const voiceConn = await voiceChannel?.join()
    if (voiceConn) {
      logger.info(`Done joining channel: ${voiceChannel?.id}!`)
      let dl: Readable | undefined
      let dispatcher: StreamDispatcher | undefined
      env.currentlyPlaying.subscribe({
        next: item => {
          if (item.removed) {
            return env.nextItemInPlaylist.next(null)
          }

          dl?.destroy()
          dispatcher?.pause()

          dl = ytdl(item.link, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 })
          dispatcher = voiceConn
            .play(dl, { highWaterMark: 1 })
            .once('finish', () => {
              env.nextItemInPlaylist.next(item)
            })

          env.sendMessage.next(`Now playing: ${item.name}`)
        },
        complete: () => {
          dl?.destroy()
          dispatcher?.destroy()
          voiceConn.disconnect()
        }
      })
    } else {
      logger.error('Failed to join voice channel...')
    }
  }

  export interface InitArgs {
    message: Message
    env: Environment
  }
}