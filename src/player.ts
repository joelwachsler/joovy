import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import ytdl from 'discord-ytdl-core'
import { Message, VoiceChannel } from 'discord.js'
import { Readable } from 'stream'
import { Environment } from './connectionHandler'
import { logger } from './logger'
import { ObservablePlaylist } from './observablePlaylist'

export namespace Player {
  export const init = async ({ message, env }: InitArgs) => {
    const throwError = (err: string) => {
      throw Error(`Unable to join voice channel: ${err}`)
    }

    const voiceChannel = message.member?.voice.channel ?? throwError('Could not determine voice channel')
    logger.info(`Joining channel: ${voiceChannel?.id}...`)

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    })

    const player = createAudioPlayer()
    connection.subscribe(player)

    connection.once(VoiceConnectionStatus.Ready, () => {
      logger.info('Connection is ready')

      if (voiceChannel instanceof VoiceChannel) {
        initPlayMedia({
          env,
          voiceChannel,
          connection,
          player,
        })
      }
    })
  }

  interface InitPlayerArgs {
    env: Environment
    voiceChannel: VoiceChannel
    connection: VoiceConnection
    player: AudioPlayer
  }

  const initPlayMedia = ({ env, voiceChannel, connection, player }: InitPlayerArgs) => {
    logger.info(`Done joining channel: ${voiceChannel?.id}!`)
    let dl: Readable | undefined
    let bass = 3
    let currentlyPlaying: ObservablePlaylist.Track | undefined
    let baseStreamTime = 0
    let volume = 0.25
    let resource: AudioResource
    let playerIsIdle = true

    const stopPlayer = () => {
      player.stop()
      dl?.destroy()
      playerIsIdle = true
    }

    env.trackAddedToQueue.subscribe(() => {
      if (playerIsIdle) {
        env.nextTrackInPlaylist.next(null)
      }
    })

    const playMedia = (track: ObservablePlaylist.Track, begin?: number) => {
      try {
        stopPlayer()

        baseStreamTime = begin ?? 0

        dl = ytdl(
          track.link,
          {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            encoderArgs: ['-af', `bass=g=${bass},dynaudnorm=f=200,volume=${volume}`],
            opusEncoded: true,
            seek: (begin ?? 0) / 1000,
          },
        )

        resource = createAudioResource(dl, {
          inputType: StreamType.Opus,
        })

        player.play(resource)

        player.once(AudioPlayerStatus.Idle, () => {
          if (!playerIsIdle) {
            player.stop()
            env.nextTrackInPlaylist.next(track)
          }
        })

        currentlyPlaying = track
      } catch (e) {
        logger.error(e)
        env.sendMessage.next(`Failed to play video: ${e}`)
        env.nextTrackInPlaylist.next(track)
      }
    }

    env.setBassLevel.subscribe(level => {
      env.sendMessage.next(`Bass level changed: \`${bass}\` -> \`${level}\``)
      bass = level
      if (currentlyPlaying) {
        player.state.status
        playMedia(currentlyPlaying, (resource?.playbackDuration ?? 0) + baseStreamTime)
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
      next: track => {
        if (!track) {
          return stopPlayer()
        }

        if (track.removed) {
          return env.nextTrackInPlaylist.next(null)
        }

        playMedia(track)
        env.sendMessage.next(`Now playing: ${track.name}`)
      },
      complete: () => {
        stopPlayer()
        connection.disconnect()
      },
    })
  }
  export interface InitArgs {
    message: Message
    env: Environment
  }
}