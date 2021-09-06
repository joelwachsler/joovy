import { Message, StreamDispatcher } from 'discord.js'
import { Readable } from 'stream'
import ytdl from 'discord-ytdl-core'
import { Environment } from './connectionHandler'
import { logger } from './logger'
import { ObservablePlaylist } from './observablePlaylist'

export namespace Player {
  export const init = async ({ message, env }: InitArgs) => {
    const voiceChannel = message.member?.voice.channel
    logger.info(`Joining channel: ${voiceChannel?.id}...`)
    const voiceConn = await voiceChannel?.join()
    if (voiceConn) {
      logger.info(`Done joining channel: ${voiceChannel?.id}!`)
      let dl: Readable | undefined
      let dispatcher: StreamDispatcher | undefined
      let bass = 1
      let currentlyPlaying: ObservablePlaylist.Item | undefined
      let baseStreamTime = 0

      const playMedia = (item: ObservablePlaylist.Item, begin?: number) => {
        try {
          dispatcher?.pause()
          dl?.destroy()

          baseStreamTime = begin ?? 0

          dl = ytdl(
            item.link,
            {
              filter: 'audioonly',
              quality: 'highestaudio',
              highWaterMark: 1 << 25,
              encoderArgs: ['-af', `bass=g=${bass}`],
              opusEncoded: true,
              seek: (begin ?? 0) / 1000,
            },
          )
          dispatcher = voiceConn
            .play(dl, { highWaterMark: 1, type: 'opus' })
            .once('finish', () => {
              env.nextItemInPlaylist.next(item)
            })

          currentlyPlaying = item
        } catch(e) {
          env.sendMessage.next(`Failed to play video: ${e}`)
          env.nextItemInPlaylist.next(item)
        }
      }

      env.setBassLevel.subscribe(level => {
        env.sendMessage.next(`Bass level changed: \`${bass}\` -> \`${level}\``)
        bass = level
        if (currentlyPlaying) {
          dispatcher?.pause()
          playMedia(currentlyPlaying, (dispatcher?.streamTime ?? 0) + baseStreamTime)
        }
      })
      env.seek.subscribe(seekTime => {
        if (currentlyPlaying) {
          playMedia(currentlyPlaying, seekTime * 1000)
          const minutes = Math.floor(seekTime / 60)
          const seconds = Math.floor(seekTime - minutes * 60)
          env.sendMessage.next(`Skipped to: \`${minutes}:${seconds}\``)
        }
      })
      env.currentlyPlaying.subscribe({
        next: item => {
          if (item.removed) {
            return env.nextItemInPlaylist.next(null)
          }

          playMedia(item)

          env.sendMessage.next(`Now playing: ${item.name}`)
        },
        complete: () => {
          dispatcher?.pause()
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