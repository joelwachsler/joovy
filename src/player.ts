import { Message, StreamDispatcher } from 'discord.js'
import { spawn } from 'threads'
import ytdl from 'ytdl-core'
import { Environment } from './connectionHandler'
import { logger } from './logger'

export namespace Player {
  export interface InitArgs {
    message: Message
    env: Environment
  }

  export const init = async ({ message, env }: InitArgs) => {
    logger.info('Joining channel...')
    const voiceConn = await message.member?.voice.channel?.join()
    let streamDispatcher: StreamDispatcher | undefined = undefined
    if (voiceConn) {
      logger.info('Done joining channel!')
      env.currentlyPlaying.subscribe({
        next: item => {
          if (streamDispatcher) {
            streamDispatcher.destroy()
          }

          streamDispatcher = voiceConn
            .play(ytdl(item.link, { filter: 'audioonly', quality: 'highestaudio' }))
            .once('finish', () => {
              env.nextItemInPlaylist.next(item)
            })
        },
        complete: () => voiceConn.disconnect()
      })
    } else {
      logger.error('Failed to join voice channel...')
    }
  }
}