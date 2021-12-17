import { MessageEmbed } from 'discord.js'
import { defaultIfEmpty, map, mergeMap, Observable } from 'rxjs'
import JEvent, { Result } from '../../jevent/JEvent'
import { Track } from '../../player/Player'
import { getPlaylist } from '../../playlist/Playlist'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Queue implements Command {
  argument = ArgParser.create('queue')
  helpText = 'Print the current queue.'

  formatQueue(event: JEvent, { queue, currentTrack }: { queue: Track[], currentTrack: number }) {
    if (queue.length === 0) {
      return new MessageEmbed()
        .setTitle('The queue is empty 👀')
    }

    const start = 0
    const pageSize = 5

    const printedQueue: string[] = []
    const end = start + pageSize
    let j = 0
    for (let i = start; i <= end; i++) {
      const track = queue[i]
      if (track) {
        if (track.removed) {
          printedQueue[j++] = `\`${i})\` ~~${track.name}~~`
        } else if (i == currentTrack) {
          printedQueue[j++] = `\`${i})\` ${track.name} ← Currently playing`
        } else {
          printedQueue[j++] = `\`${i})\` ${track.name}`
        }
      }
    }
  
    return new MessageEmbed()
      .setColor('#ffb81f')
      .setTitle('Queue')
      .setDescription(printedQueue.join('\n'))
      // will cause testing errors if this is not defined
      .setTimestamp(event.timestamp)
  }

  handleMessage(event: JEvent): Observable<Result> {
    return getPlaylist(event).pipe(
      map(playlist => playlist.currentQueue),
      defaultIfEmpty({
        currentTrack: -1,
        queue: [],
      }),
      map(queue => this.formatQueue(event, queue)),
      mergeMap(msg => event.sendMessage(msg)),
    )
  }
}
