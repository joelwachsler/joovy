import { Message } from 'discord.js'
import { Subject } from 'rxjs'
import { Environment } from './connectionHandler'

export namespace ObservablePlaylist {
  export const init = (env: Environment) => {
    const queue: Item[] = []
    const removeItemInQueue = new Subject<Remove>()
    removeItemInQueue.subscribe(removeItem => {
      queue[removeItem.from].removed = true
    })

    let currentIndex = -1
    env.nextItemInPlaylist.subscribe(current => {
      if (current) {
        currentIndex = current.index
      }
      const nextItem = queue[++currentIndex]
      if (nextItem) {
        env.currentlyPlaying.next(nextItem)
      } else{
        env.sendMessage.next('End of playlist, disconnecting.')
        env.disconnect.next(null)
      }
    })

    const addToQueue = (newItem: Omit<Item, 'index'>, index: number) => {
      queue.push({
        ...newItem,
        index,
      })

      // Check if this is the first entry added in the playlist, if this is the case -> start the queue.
      if (queue.length === 1) {
        env.nextItemInPlaylist.next(null)
      }
    }

    env.addItemToQueue.subscribe(newItem => {
      addToQueue(newItem, queue.length)
    })

    env.addNextItemToQueue.subscribe(newItem => {
      addToQueue(newItem, currentIndex + 1)
    })

    env.removeFromQueue.subscribe(({ from, to }) => {
      let shouldEmitSkipEvent = false
      for (let i = from; i <= to; i++) {
        if (i === currentIndex) {
          shouldEmitSkipEvent = true
        }

        const item = queue[i]
        if (item) {
          item.removed = true
          env.sendMessage.next(`${item.name} has been removed.`)
        }
      }

      if (shouldEmitSkipEvent) {
        env.nextItemInPlaylist.next(null)
      }
    })

    env.printQueueRequest.subscribe(_ => {
      if (queue.length === 0) {
        env.sendMessage.next('The queue is empty...')
      } else {
        const printedQueue: string[] = []
        const start = currentIndex
        const end = currentIndex + 5
        for (let i = start; i <= end; i++) {
          const curr = queue[i]
          if (curr) {
            if (curr.removed) {
              printedQueue[i] = `[${i}] ~~${curr.name}~~`
            } else {
              printedQueue[i] = `[${i}] ${curr.name}`
            }
          }
        }

        printedQueue[currentIndex] = `${printedQueue[currentIndex]} <-- Now playing`
        if (end < queue.length) {
          printedQueue.push('...')
        }

        env.sendMessage.next(printedQueue.join('\n\n'))
      }
    })
  }

  export interface Item {
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
    currentlyPlaying: Subject<Item>
    nextItemInPlaylist: Subject<Item | undefined>
  }
}
