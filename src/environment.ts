import { Message } from 'discord.js'
import { Subject } from 'rxjs'
import { EditedMessage, MsgType } from './connectionHandler'
import { ObservablePlaylist } from './observablePlaylist'

export interface Environment {
  sendMessage: Subject<MsgType>
  editMessage: Subject<EditedMessage>
  currentlyPlaying: Subject<ObservablePlaylist.Track | null>
  nextTrackInPlaylist: Subject<ObservablePlaylist.Track | null>
  trackAddedToQueue: Subject<null>
  addTrackToQueue: Subject<Omit<ObservablePlaylist.Track, 'index'>>
  addNextTrackToQueue: Subject<Omit<ObservablePlaylist.Track, 'index'>>
  printQueueRequest: Subject<null>
  reprintQueueOnReaction: Subject<Message>
  removeFromQueue: Subject<ObservablePlaylist.Remove>
  removeLatestFromQueue: Subject<null>
  disconnect: Subject<null>
  setBassLevel: Subject<number>
  seek: Subject<number>
}

export const initEnvironment = (): Environment => {
  return {
    sendMessage: new Subject(),
    editMessage: new Subject(),
    currentlyPlaying: new Subject(),
    nextTrackInPlaylist: new Subject(),
    trackAddedToQueue: new Subject(),
    addTrackToQueue: new Subject(),
    addNextTrackToQueue: new Subject(),
    printQueueRequest: new Subject(),
    reprintQueueOnReaction: new Subject(),
    removeFromQueue: new Subject(),
    removeLatestFromQueue: new Subject(),
    disconnect: new Subject(),
    setBassLevel: new Subject(),
    seek: new Subject(),
  }
}
