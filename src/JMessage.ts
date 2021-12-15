import { Message } from 'discord.js'

/**
 * Facade around Message for easier test implementations.
 */
export interface JMessage {
  channelId: string
  author: {
    username: string
    bot: boolean
    id: string
  }
  content: string
}

export const from = (message: Message): JMessage => message
