import { Message, MessageEmbed, VoiceConnection, VoiceState } from 'discord.js';
import yts from 'yt-search';
import { logger } from './logger';
import { Player } from './player';
import { Playlist } from './playlist';

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
}

class CmdHandler {
  private voiceConn: VoiceConnection
  private playlist: Playlist
  private sendMessage: SendMessage

  constructor({ playlist, message, voiceConn }: CmdHandlerArgs) {
    this.playlist = playlist
    this.voiceConn = voiceConn
    this.sendMessage = async msg => sendMessage({ message, msg })
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
    const query = message.content.split('/play ')[1]
    if (query.startsWith('http')) {
      const videoIdMatch = query.match(new RegExp(/https:\/\/www.youtube.com\/watch\?.*?v=(\w+).*?/))
      if (videoIdMatch) {
        const [_, videoId] = videoIdMatch
        const r = await yts.search({ videoId })
        const newItem: QueueItem = {
          link: query,
          name: `${r.title} (${r.timestamp})`,
          message,
        }
        await this.sendMessage(`[${newItem.name}](${query}) has been queued.`)
        await this.playlist.addItemToQueue(newItem)
      } else {
        await this.sendMessage('Sorry, couldn\'t parse the video id...')
      }
    }
  }

  private async skip() {
    await this.playlist.nextItemInQueue()
  }

  private async printQueue() {
  }
}

export const handleMessage = async (message: Message) => {
  const channelId = message.member?.voice.channel?.id

  if (channelId) {
    if (!connectionHandlerMapper.has(channelId)) {
      const voice = message.member?.voice
      const voiceConn = await voice?.channel?.join()
      if (voiceConn && voice) {
        connectionHandlerMapper.set(
          channelId,
          new CmdHandler({ voice, voiceConn, message, playlist: new Playlist() }),
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
