import { AudioPlayer, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { Message, VoiceChannel } from 'discord.js'
import { map, Observable } from 'rxjs'
import { logger } from '../logger'
import { Ytdl } from './Ytdl'

export interface Player {
  play(track: Player.Track): Observable<void>
  disconnect(): void
}

export namespace Player {
  export interface Track {
    name: string
    link: string
  }

  export type Factory = Observable<Player>

  export const from = (message: Message): Observable<Player> => {
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

    return new Observable(observer => {
      connection.once(VoiceConnectionStatus.Ready, () => {
        logger.info('Connection is ready')

        if (voiceChannel instanceof VoiceChannel) {
          observer.next(new PlayerImpl(player, connection))
          observer.complete()
        } else {
          observer.error(`Voice channel was not correct type, got: ${typeof voiceChannel}, expected: ${typeof VoiceChannel}`)
        }
      })
    })
  }

  class PlayerImpl implements Player {
    private bass = 3
    private volume = 0.25
    private begin = 0

    constructor(private player: AudioPlayer, private connection: VoiceConnection) { }

    play(track: Track) {
      return this.createReadStream(track)
        .pipe(
          map(dl => createAudioResource(dl)),
          map(resource => this.player.play(resource)),
        )
    }

    private createReadStream(track: Track) {
      return Ytdl.createStream({
        url: track.link,
        options: {
          encoderArgs: ['-af', `bass=g=${this.bass},dynaudnorm=f=200,volume=${this.volume}`],
          opusEncoded: true,
          seek: (this.begin ?? 0) / 1000,
        },
        ytdlOptions: {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
        },
      })
    }

    disconnect() {
      this.player.stop()
      this.connection.disconnect()
    }
  }
}
