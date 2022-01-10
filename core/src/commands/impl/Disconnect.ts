import { Client } from 'discord.js'
import { concat, mergeMap, Observable } from 'rxjs'
import JEvent, { fromMessageKey } from '../../jevent/JEvent'
import { Result } from '../../jevent/Result'
import { KMessage, Topics } from '../../kafka/kafka'
import { createConsumer } from '../../kafka/util'
import { removePlaylist } from '../../playlist/Playlist'
import { logResult } from '../../resultLogger'
import { removeObjectStore } from '../../store/util'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  handleMessage(event: JEvent): Observable<Result> {
    return event.factory.kafkaProducer().pipe(mergeMap(producer => {
      return producer.send({
        topic: Topics.Disconnect,
        event,
        message: createDisconnectMessage(event),
      })
    }))
  }
}

export const handleDisconnects = (client: Client) => {
  const disconnectHandler = createConsumer<DisconnectMessage>({ groupId: 'joovy-disconnect-handler', topic: Topics.Disconnect }).pipe(
    mergeMap(message => fromMessageKey(client, message.meta.messageKey)),
    disconnectFromChannel,
  )

  logResult('disconnect', disconnectHandler)
}

export const disconnectFromChannel = (event: Observable<JEvent>) => {
  return event.pipe(
    mergeMap(event => {
      const playlistRemoval = removePlaylist(event)
      const removeChannelStore = removeObjectStore(event)
      const sendByeMessage = event.sendMessage('Bye!')

      return concat(playlistRemoval, removeChannelStore, sendByeMessage)
    }),
  )
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
