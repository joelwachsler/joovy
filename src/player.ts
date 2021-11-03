import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus
} from '@discordjs/voice'
import { Message, VoiceChannel } from 'discord.js'
import { Readable } from 'stream'
import { Environment } from './connectionHandler'
import { logger } from './logger'
import { ObservablePlaylist } from './observablePlaylist'
import { Ytdl } from './ytdl'

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

    const handleError = (err: any, currentTrack?: ObservablePlaylist.Track) => {
      logger.error(err)
      env.sendMessage.next(`Failed to play video: ${err}`)
      if (currentTrack) {
        env.nextTrackInPlaylist.next(currentTrack)
      }
    }

    const playMedia = async (track: ObservablePlaylist.Track, begin?: number) => {
      try {
        stopPlayer()
        playerIsIdle = false

        baseStreamTime = begin ?? 0

        dl = await Ytdl.createStream({
          url: track.link,
          options: {
            encoderArgs: ['-af', `bass=g=${bass},dynaudnorm=f=200,volume=${volume}`],
            opusEncoded: true,
            seek: (begin ?? 0) / 1000,
          },
          ytdlOptions: {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
          },
        })

        dl.on('error', err => handleError(err, track))

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
        handleError(e, track)
      }
    }

    env.setBassLevel.subscribe(async level => {
      env.sendMessage.next(`Bass level changed: \`${bass}\` -> \`${level}\``)
      bass = level
      if (currentlyPlaying) {
        player.state.status
        await playMedia(currentlyPlaying, (resource?.playbackDuration ?? 0) + baseStreamTime)
      }
    })

    env.seek.subscribe(async seekTime => {
      if (currentlyPlaying) {
        await playMedia(currentlyPlaying, seekTime * 1000)
        const minutes = Math.floor(seekTime / 60)
        const seconds = Math.floor(seekTime - minutes * 60)
        env.sendMessage.next(`Skipped to: \`${minutes}:${seconds}\``)
      }
    })

    env.currentlyPlaying.subscribe({
      next: async track => {
        if (!track) {
          return stopPlayer()
        }

        if (track.removed) {
          return env.nextTrackInPlaylist.next(null)
        }

        await playMedia(track)
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