import { Message } from 'discord.js'
import { Subject } from 'rxjs'
import { Environment, MessageWithReactions } from './connectionHandler'

export namespace ObservablePlaylist {
  export const init = (env: Environment) => {
    const queue: Track[] = []
    const removTrackInQueue = new Subject<Remove>()
    removTrackInQueue.subscribe(removeTrack => {
      queue[removeTrack.from].removed = true
    })

    let timeoutHandle: NodeJS.Timeout | undefined
    const timeout = 1000 * 60 * 5

    let currentQueueIndex = -1
    env.nextTrackInPlaylist.subscribe(trackToPlay => {
      if (trackToPlay) {
        currentQueueIndex = trackToPlay.index
      }
      const nextTrack = queue[++currentQueueIndex]
      if (nextTrack) {
        env.currentlyPlaying.next(nextTrack)
      } else {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
          timeoutHandle = undefined
        }

        env.sendMessage.next(`End of playlist, will disconnect in ${timeout / 1000 / 60} minutes.`)
        timeoutHandle = setTimeout(() => {
          env.disconnect.next(null)
        }, timeout)

        env.currentlyPlaying.next(null)
      }
    })

    const addToQueue = (newTrack: Omit<Track, 'index'>, index: number) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        timeoutHandle = undefined
      }
      queue.splice(index, 0, {
        ...newTrack,
        index,
      })

      for (let i = 0; i < queue.length; i++) {
        queue[i].index = i
      }

      if (currentQueueIndex > (queue.length - 2)) {
        currentQueueIndex = queue.length - 2
      }

      env.trackAddedToQueue.next(null)
    }

    env.addTrackToQueue.subscribe(newTrack => addToQueue(newTrack, queue.length))
    env.addNextTrackToQueue.subscribe(newTrack => addToQueue(newTrack, currentQueueIndex + 1))

    env.removeFromQueue.subscribe(({ from, to }) => {
      let shouldEmitSkipEvent = false
      for (let i = from; i <= to; i++) {
        if (i === currentQueueIndex) {
          shouldEmitSkipEvent = true
        }

        const track = queue[i]
        if (track) {
          track.removed = true
          env.sendMessage.next(`${track.name} has been removed.`)
        }
      }

      if (shouldEmitSkipEvent) {
        env.nextTrackInPlaylist.next(null)
      }
    })

    env.printQueueRequest.subscribe(() => {
      if (queue.length === 0 || queue.length <= currentQueueIndex) {
        env.sendMessage.next('The queue is empty 👀')
      } else {
        const printedQueue: string[] = []
        const start = currentQueueIndex
        const end = currentQueueIndex + 5
        for (let i = start; i <= end; i++) {
          const curr = queue[i]
          if (curr) {
            if (curr.removed) {
              printedQueue[i] = `\`${i})\` ~~${curr.name}~~`
            } else {
              printedQueue[i] = `\`${i})\` ${curr.name}`
            }
          }
        }
        printedQueue[currentQueueIndex] = `${printedQueue[currentQueueIndex]} ← Currently playing`

        let reactions: string[] = []
        if (end < queue.length) {
          printedQueue.push('\n' + (queue.length - end) + ' more track(s) in queue.')
          reactions.push('◀', '▶')

          if (end < queue.length * 2) {
            reactions.push('⏩')
          }
        }

        env.sendMessage.next(new MessageWithReactions(printedQueue.join('\n'), reactions))
      }
    })
  }

  export interface Track {
    name: string
    link: string
    message: Message
    removed?: boolean
    index: number
  }

  export interface Remove {
    from: number
    to: number
  }

  export interface InitArgs {
    currentlyPlaying: Subject<Track>
    nextTrackInPlaylist: Subject<Track | undefined>
  }
}
