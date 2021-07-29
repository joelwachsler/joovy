import { StreamDispatcher, VoiceConnection } from 'discord.js'
import ytdl from 'ytdl-core'
import { SendMessage } from './connectionHandler'
import { logger } from './logger'
import { Playlist, PlaylistEvent } from './playlist'

export namespace Player {
  export const init = ({ voiceConn, playlist, sendMessage }: PlayerArgs) => {
    let play: StreamDispatcher | null = null
    playlist.on(PlaylistEvent.CHANGE, async item => {
      play = voiceConn.play(ytdl(item.link, { filter: 'audioonly', quality: 'highestaudio' }))
      play.on('finish', async () => {
        await playlist.nextItemInQueue()
      })
      await sendMessage(`Now playing: [${item.name}](${item.link})`)
    })

    playlist.on(PlaylistEvent.FINISHED, async () => {
      if (play) {
        play.destroy()
        play = null
      }
    })

    logger.info('Player ready!')
  }

  export interface PlayerArgs {
    voiceConn: VoiceConnection
    playlist: Playlist
    sendMessage: SendMessage
  }
}