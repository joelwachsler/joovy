import { QueueItem } from './connectionHandler'

type PlaylistHandler = (currentPlaylistItem: QueueItem) => Promise<void>
export enum PlaylistEvent {
  CHANGE,
  FINISHED,
}

export class Playlist {

  private handlers: Map<PlaylistEvent, PlaylistHandler[]> = new Map()
  private playlist: QueueItem[] = []
  private currentlyPlaying = 0
  private isPlaying = false

  async addItemToQueue(item: QueueItem) {
    this.playlist.push(item)
    if (!this.isPlaying) {
      this.isPlaying = true
      await this.triggerEvent(PlaylistEvent.CHANGE)
    }
  }

  async previousItemInQueue() {
    this.currentlyPlaying--
    if (this.currentlyPlaying < 0){
      this.currentlyPlaying = 0
    }
    await this.triggerEvent(PlaylistEvent.CHANGE)
  }

  async removeItemInQueue(fromIndex: number, toIndex?: number) {
    const removedItems: QueueItem[] = []
    const lastIndex = toIndex ?? fromIndex + 1
    for (let i = fromIndex; i < lastIndex; i++) {
      const item = this.playlist[i]
      item.skipped = true
      removedItems.push(item)
    }
    if (fromIndex === this.currentlyPlaying) {
      await this.triggerEvent(PlaylistEvent.CHANGE)
    }

    return removedItems
  }

  async nextItemInQueue() {
    this.currentlyPlaying++
    if (this.currentPlayingItem.skipped) {
      this.nextItemInQueue()
    } else if (this.currentlyPlaying > this.playlist.length) {
      await this.triggerEvent(PlaylistEvent.FINISHED)
    } else {
      await this.triggerEvent(PlaylistEvent.CHANGE)
    }
  }

  on(event: PlaylistEvent, listener: PlaylistHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(listener)
    return this
  }

  get currentPlayingItem() {
    return this.playlist[this.currentlyPlaying]
  }

  private async triggerEvent(event: PlaylistEvent) {
    const playlistItem = this.currentPlayingItem
    for (const handler of (this.handlers.get(event) ?? [])) {
      await handler(playlistItem)
    }
  }

  get currentPlaylist() {
    return this.playlist
  }

  get playlistIndex() {
    return this.currentlyPlaying
  }
}