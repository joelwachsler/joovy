import { randomUUID } from 'crypto'
import { concat, defaultIfEmpty, map, mapTo, mergeAll, mergeMap, Observable, of } from 'rxjs'
import JEvent from '../jevent/JEvent'
import { StringStore } from '../store/Store'
import { Playlist } from './Playlist'

export const trackPlaylist = (event: JEvent, playlist: Playlist) => {
  return event.store.persistentString.pipe(
    map(store => createRepositories(store)),
    mergeMap(repos => {
      const playlistId = randomUUID()
      const { channelId } = event.message

      const createPlaylist = repos.channel.getOrCreate(event, channelId).pipe(
        mergeMap(channel => {
          channel.playlists = [...channel.playlists, playlistId]
          return repos.channel.put(channelId, channel)
        }),
      )

      const tracking = concat(
        createPlaylist,
        playlist.internalCurrentQueue.pipe(
          mergeMap(currentQueue => {
            return repos.playlist.getOrCreate(event, playlistId).pipe(
              mergeMap(queue => {
                queue.tracks = currentQueue.map(track => {
                  return {
                    version: '1',
                    author: {
                      version: '1',
                      id: track.author.id,
                      username: track.author.username,
                    },
                    name: track.name,
                    link: track.link,
                  }
                })

                return repos.playlist.put(playlistId, queue)
              }),
            )
          }),
        ),
      )

      return tracking.pipe(
        mergeMap(e => event.complexResult({ result: { playlist: 'trackingEvent' }, item: e })),
      )
    }),
  )
}

abstract class Repository<Entity extends Version, ID extends string = string> {
  constructor(private store: StringStore) { }

  get(id: ID): Observable<Entity> {
    return this.store.get(id).pipe(map(e => JSON.stringify(e) as unknown as Entity))
  }

  put(id: ID, entity: Entity): Observable<Entity> {
    return this.store.put(id, JSON.stringify(entity)).pipe(mapTo(entity))
  }

  getOrCreate(event: JEvent, id: ID): Observable<Entity> {
    return this.get(id).pipe(
      map(e => of(e)),
      defaultIfEmpty(this.put(id, this.defaultEntity(event))),
      mergeAll(),
    )
  }

  abstract defaultEntity(event: JEvent): Entity
}

const createRepositories = (store: StringStore) => {
  return {
    channel: new class extends Repository<ChannelV1> {
      defaultEntity(): ChannelV1 {
        return {
          version: '1',
          playlists: [],
        }
      }
    }(store),
    playlist: new class extends Repository<PlaylistV1> {
      defaultEntity(event: JEvent): PlaylistV1 {
        return {
          version: '1',
          date: event.timestamp,
          tracks: [],
        }
      }
    }(store),
  }
}

interface ChannelV1 extends Version<'1'> {
  playlists: PlaylistIdentifier[]
}

type PlaylistIdentifier = string

interface PlaylistV1 extends Version<'1'> {
  date: number
  tracks: TrackV1[]
}

interface TrackV1 extends Version<'1'> {
  author: AuthorV1
  name: string
  link: string
}

interface AuthorV1 extends Version<'1'> {
  id: string
  username: string
}

interface Version<Version = string> {
  version: Version
}
