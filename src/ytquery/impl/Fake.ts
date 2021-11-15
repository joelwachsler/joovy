import { map, Observable, of } from 'rxjs'
import { ObservablePlaylist } from '../../observablePlaylist'
import { YtQuery } from '../YtQuery'

export const runQueryFake = ({ message }: YtQuery.ParseQueryArgs): Observable<Omit<ObservablePlaylist.Track, "index">> => {
  const dummyInfo = {
    url: 'http://example.com',
    title: 'test title',
    timestamp: 0,
  }

  return of(dummyInfo)
    .pipe(map(info => {
      const newTrack: Omit<ObservablePlaylist.Track, 'index'> = {
        link: info.url,
        name: `[${info.title} (${info.timestamp})](${info.url}) [<@${message.author.id}>]`,
        message,
      }

      return newTrack
    }))
}