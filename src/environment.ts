import { Message } from 'discord.js'
import { Subject } from 'rxjs'
import { EditedMessage, MsgType } from './connectionHandler'
import { ObservablePlaylist } from './observablePlaylist'

export type Environment = ReturnType<typeof initEnvironment>

export const initEnvironment = () => {
  return {
    sendMessage: new Subject<MsgType>(),
    editMessage: new Subject<EditedMessage>(),
    currentlyPlaying: new Subject<ObservablePlaylist.Track | null>(),
    nextTrackInPlaylist: new Subject<ObservablePlaylist.Track | null>(),
    trackAddedToQueue: new Subject<null>(),
    addTrackToQueue: new Subject<Omit<ObservablePlaylist.Track, 'index'>>(),
    addNextTrackToQueue: new Subject<Omit<ObservablePlaylist.Track, 'index'>>(),
    printQueueRequest: new Subject<null>(),
    reprintQueueOnReaction: new Subject<Message>(),
    removeFromQueue: new Subject<ObservablePlaylist.Remove>(),
    removeLatestFromQueue: new Subject<null>(),
    disconnect: new Subject<null>(),
    setBassLevel: new Subject<number>(),
    seek: new Subject<number>(),
  }
}

export const destroyEnv = (env: Environment) => {
  Object.values(env).forEach(envValue => {
    if (envValue instanceof Subject) {
      envValue.complete()
    }
  })
}
