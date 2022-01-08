import { Client } from 'discord.js'
import { concat, mergeMap } from 'rxjs'
import JEvent, { removeObjectStore, fromMessageKey } from './jevent/JEvent'
import { createConsumer, KMessage, Topics } from './kafka/kafka'
import { removePlaylist } from './playlist/Playlist'
import { logResult } from './resultLogger'

export const handleDisconnects = (client: Client) => {
  const disconnectHandler = createConsumer<DisconnectMessage>({ groupId: 'joovy-disconnect-handler', topic: Topics.Disconnect }).pipe(
    mergeMap(message => fromMessageKey(client, message.meta.messageKey)),
    mergeMap(event => {
      const playlistRemoval = removePlaylist(event)
      const removeChannelStore = removeObjectStore(event)
      const sendByeMessage = event.sendMessage('Bye!')

      return concat(playlistRemoval, removeChannelStore, sendByeMessage)
    }),
  )

  logResult('disconnect', disconnectHandler)
}

type DisconnectMessage = KMessage<'disconnect', '1'>

export const createDisconnectMessage = (event: JEvent): DisconnectMessage => {
  return {
    meta: {
      messageKey: event.message.messageKey,
      name: 'disconnect',
      version: '1',
    },
  }
}
