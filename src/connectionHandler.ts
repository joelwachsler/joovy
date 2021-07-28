import { Message, VoiceConnection } from 'discord.js';
import ytdl from 'ytdl-core';
import { logger } from './logger';

const connectionHandlerMapper = new Map<string, ConnectionHandler>()

interface QueueItem {
  name: string
  link: string
  message: Message
}

export class ConnectionHandler {

  private channelQueue: QueueItem[] = []
  private currentlyPlaying?: QueueItem

  constructor(private conn: VoiceConnection) {}

  async handleMessage(message: Message) {
    const { content } = message

    if (content === '/disconnect') {
      this.disconnect()
    } else if (content.startsWith('/play')) {
      await this.play(message)
    } else if (content === '/queue') {
      await this.printQueue(message)
    } else if (content === '/skip') {
      await this.skip(message)
    }
  }

  private async play(message: Message) {
    const itemToPlay = message.content.split(" ")[1]
    const newEntry: QueueItem = {
      name: '',
      link: itemToPlay,
      message,
    }
    if (this.currentlyPlaying) {
      this.channelQueue.push(newEntry)
      message.channel.send(`${newEntry.link} has been queued, there are now ${this.channelQueue.length} items queued.`)
      return
    }

    this.currentlyPlaying = newEntry
    const play = this.conn.play(ytdl(itemToPlay, { filter: 'audioonly', quality: 'highestaudio' }))
    play.on('finish', () => {
      this.finishedPlaying()
    })
    logger.info(`Playing: ${itemToPlay}`)
    await message.channel.send(`Now playing: ${itemToPlay}`)
  }

  private async finishedPlaying() {
    const nextItem = this.channelQueue.pop()
    if (!nextItem) {
      this.currentlyPlaying?.message.channel.send(`There are no more songs left in the queue, disconnecting.`)
      return this.disconnect()
    }

    this.currentlyPlaying = undefined
    this.play(nextItem.message)
  }

  private async printQueue(message: Message) {
    await message.channel.send(`The queue: is: ${this.channelQueue}`)
  }

  private async skip(message: Message) {
    await this.finishedPlaying()
  }

  private disconnect() {
    connectionHandlerMapper.delete(this.conn.channel.id)
    this.conn.disconnect()
  }
}

export const handleMessage = async (message: Message) => {
  const channelId = message.member?.voice.channel?.id

  if (channelId) {
    if (!connectionHandlerMapper.has(channelId)) {
      const channelConn = await message.member?.voice.channel?.join()
      if (channelConn) {
        connectionHandlerMapper.set(channelId, new ConnectionHandler(channelConn))
        logger.info(`Joined: ${channelId}`)
      } else {
        logger.info('Failed to join channel...')
      }
    }

    const ch = connectionHandlerMapper.get(channelId)
    if (ch) {
      await ch.handleMessage(message)
    }
  }
}
