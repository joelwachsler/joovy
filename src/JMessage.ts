import { Message } from 'discord.js';

export interface JMessage {
  channelId: string
  author: {
    bot: boolean
    id: string
  }
  content: string
}

export namespace JMessage {
  export const from = (message: Message): JMessage => message
}
