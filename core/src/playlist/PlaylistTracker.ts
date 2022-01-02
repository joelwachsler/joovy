import { catchError, concat, defaultIfEmpty, map, mapTo, mergeAll, mergeMap, Observable, of } from 'rxjs'
import { errorHandler } from '../errorHandler'
import JEvent from '../jevent/JEvent'
import Track from '../player/Track'
import { getOrCreateStore } from '../store/impl/LevelStore'
import { StringStore } from '../store/Store'
import { Playlist } from './Playlist'

export const trackPlaylist = (event: JEvent, playlist: Playlist) => {
  const events = event.store.persistentString.pipe(
    map(store => createRepositories(store)),
    mergeMap(repos => {
      const playlistId = event.factory.uuid()
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
                queue.tracks = currentQueue.map(track => trackToTrackV1(track))
                return repos.playlist.put(playlistId, queue)
              }),
            )
          }),
        ),
      )

      return tracking.pipe(
        mergeMap(e => event.complexResult({ result: TRACKING_EVENT, item: e })),
      )
    }),
  )

  return events.pipe(
    // prevent whole play-session from crashing if something goes bad here
    catchError(err => errorHandler(event, err)),
  )
}

export const TRACKING_EVENT = { playlist: 'trackingEvent' }

abstract class Repository<Entity extends Meta, ID extends string = string> {
  constructor(private store: StringStore) { }

  get(id: ID): Observable<Entity> {
    return this.store.get(id).pipe(map(e => JSON.parse(e) as unknown as Entity))
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

class ChannelRepository extends Repository<ChannelV1> {
  defaultEntity(): ChannelV1 {
    return {
      meta: {
        name: Type.Channel,
        version: Version.v1,
      },
      playlists: [],
    }
  }
}

class PlaylistRepository extends Repository<PlaylistV1> {
  defaultEntity(event: JEvent): PlaylistV1 {
    return {
      meta: {
        name: Type.Playlist,
        version: Version.v1,
      },
      date: event.timestamp,
      tracks: [],
    }
  }
}

const createRepositories = (store: StringStore) => {
  return {
    channel: new ChannelRepository(store),
    playlist: new PlaylistRepository(store),
  }
}

export const dumpV1 = (): Promise<DumpV1> => {
  return new Promise(resolve => {
    const dump: DumpV1 = {
      channels: [],
      playlists: [],
    }

    getOrCreateStore().pipe(mergeMap(store => store.dump())).subscribe({
      next: keyValue => {
        const { key, value } = keyValue
        const item = JSON.parse(value.toString()) as Meta

        if (isChannel(item)) {
          dump.channels.push({
            key: key.toString(),
            channel: item,
          })
        } else if (isPlaylist(item)) {
          dump.playlists.push(item)
        } else {
          throw Error(`Unknown object: ${item}`)
        }
      },
      complete: () => resolve(dump),
    })
  })
}

const trackToTrackV1 = (track: Track): TrackV1 => {
  return {
    meta: {
      name: Type.Track,
      version: Version.v1,
    },
    author: {
      meta: {
        name: Type.Author,
        version: Version.v1,
      },
      id: track.author.id,
      username: track.author.username,
    },
    name: track.name,
    link: track.link,
  }
}

const isChannel = (item: Meta): item is ChannelV1 => {
  return item.meta.name === Type.Channel
}

const isPlaylist = (item: Meta): item is PlaylistV1 => {
  return item.meta.name === Type.Playlist
}

interface DumpV1 {
  channels: ChannelDumpV1[]
  playlists: PlaylistV1[]
}

interface ChannelDumpV1 {
  key: string
  channel: ChannelV1
}

interface ChannelV1 extends Meta<Type.Channel, Version.v1> {
  playlists: PlaylistIdentifier[]
}

type PlaylistIdentifier = string

interface PlaylistV1 extends Meta<Type.Playlist, Version.v1> {
  date: number
  tracks: TrackV1[]
}

interface TrackV1 extends Meta<Type.Track, Version.v1> {
  author: AuthorV1
  name: string
  link: string
}

interface AuthorV1 extends Meta<Type.Author, Version.v1> {
  id: string
  username: string
}

interface Meta<Name = string, Version = string> {
  meta: {
    name: Name
    version: Version
  }
}

enum Type {
  Channel = 'channel',
  Playlist = 'playlist',
  Track = 'track',
  Author = 'author',
}

enum Version {
  v1 = '1',
}
