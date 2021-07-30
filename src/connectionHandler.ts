import { Message, MessageEmbed, VoiceConnection, VoiceState } from 'discord.js';
import { Pool, spawn } from 'threads';
import { logger } from './logger';
import { Player } from './player';
import { Playlist } from './playlist';
import { Worker } from 'threads'
import { VideoMetadataResult } from 'yt-search';

const connectionHandlerMapper = new Map<string, CmdHandler>()

export interface QueueItem {
  name: string
  link: string
  message: Message
}

export type SendMessage = (msg: string) => Promise<void>

interface SendMessageArgs {
  msg: string,
  message: Message
}

const sendMessage = async ({ msg, message }: SendMessageArgs) => {
  const embed = new MessageEmbed().setDescription(msg)
  await message.channel.send(embed)
}

interface CmdHandlerArgs {
  playlist: Playlist
  message: Message
  voice: VoiceState
  voiceConn: VoiceConnection
  pool: Pool<any>
}

class CmdHandler {
  private voiceConn: VoiceConnection
  private playlist: Playlist
  private sendMessage: SendMessage
  private pool: Pool<any>

  constructor({ playlist, message, voiceConn, pool }: CmdHandlerArgs) {
    this.playlist = playlist
    this.voiceConn = voiceConn
    this.sendMessage = async msg => sendMessage({ message, msg })
    this.pool = pool
    Player.init({
      playlist,
      sendMessage: this.sendMessage,
      voiceConn,
    })
  }

  async handle(message: Message) {
    const { content } = message

    if (content === '/disconnect') {
      await this.disconnect()
    } else if (content.startsWith('/play')) {
      await this.play(message)
    } else if (content === '/queue') {
      await this.printQueue()
    } else if (content === '/skip') {
      this.skip()
    }
  }

  private async disconnect() {
    this.voiceConn.disconnect()
  }

  private async play(message: Message) {
    this.pool.queue(async worker => {
      const query = message.content.split('/play ')[1]
      const res = await worker.fetchInfo(query)
      const info = JSON.parse(res) as VideoMetadataResult
      if (info) {
        const newItem: QueueItem = {
          link: info.url,
          name: `${info.title} (${info.timestamp})`,
          message,
        }
        await this.sendMessage(`[${newItem.name}](${newItem.link}) has been queued.`)
        await this.playlist.addItemToQueue(newItem)
      }
    })
  }

  private async skip() {
    await this.playlist.nextItemInQueue()
  }

  private async printQueue() {
  }
}

export const handleMessage = async (message: Message, pool: Pool<any>) => {
  const channelId = message.member?.voice.channel?.id

  if (channelId) {
    if (!connectionHandlerMapper.has(channelId)) {
      const voice = message.member?.voice
      const voiceConn = await voice?.channel?.join()
      if (voiceConn && voice) {
        connectionHandlerMapper.set(
          channelId,
          new CmdHandler({
            voice,
            voiceConn,
            message,
            playlist: new Playlist(),
            pool
          }),
        )
        logger.info(`Joined: ${channelId}`)
      } else {
        logger.info('Failed to join channel...')
      }
    }

    const ch = connectionHandlerMapper.get(channelId)
    if (ch) {
      await ch.handle(message)
    }
  }
}
