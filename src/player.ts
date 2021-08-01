import { Message } from 'discord.js'
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
      env.currentlyPlaying.subscribe({
        next: item => {
          if (item.removed) {
            return env.nextItemInPlaylist.next(null)
          }

          voiceConn
            .play(ytdl(item.link, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }), { highWaterMark: 1 })
            .once('finish', () => {
              env.nextItemInPlaylist.next(item)
            })

          env.sendMessage.next(`Now playing: ${item.name}`)
        },
        complete: () => voiceConn.disconnect()
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