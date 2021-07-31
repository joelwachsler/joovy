import { Message } from 'discord.js'
import { Subject } from 'rxjs'
import { Environment } from './connectionHandler'

export namespace ObservablePlaylist {
  export interface Item {
    name: string
    link: string
    message: Message
    skipped?: boolean
    index: number
  }

  export interface Remove {
    from: number
    to?: number
  }

  export interface InitArgs {
    currentlyPlaying: Subject<Item>
    nextItemInPlaylist: Subject<Item | undefined>
  }

  export const init = (env: Environment) => {
    const queue: Item[] = []
    const removeItemInQueue = new Subject<Remove>()
    removeItemInQueue.subscribe(removeItem => {
      queue[removeItem.from].skipped = true
    })

    let index = -1
    env.nextItemInPlaylist.subscribe(current => {
      if (current) {
        index = current.index
      }
      env.currentlyPlaying.next(queue[++index])
    })

    env.addItemToQueue.subscribe(newItem => {
      queue.push({
        ...newItem,
        index: queue.length,
      })

      // Check if this is the first entry added in the playlist, if this is the case -> start the queue.
      if (queue.length === 1) {
        env.nextItemInPlaylist.next(null)
      }
    })

    env.printQueueRequest.subscribe(_ => {
      if (queue.length === 0) {
        env.sendMessage.next('The queue is empty...')
      } else {
        let counter = 0
        const printedQueue = queue.map(p => p.skipped ? `[${counter++}] ~~${p.name}~~` : `[${counter++}] ${p.name}`)
        printedQueue[index] = `${printedQueue[index]} <-- Playing`
        env.sendMessage.next(printedQueue.join('\n\n'))
      }
    })
  }
}
