import { defer, filter, from, map, Observable } from 'rxjs'
import yts from 'yt-search'
import ytdl from 'ytdl-core'
import { YtSearchResult } from '../JEvent'

export const ytSearchFactoryImpl = (query: string): Observable<YtSearchResult> => {
  return defer(() => {
    const normalLink = /(?:https)?:\/\/www.youtube.com\/watch\?.*?v=(\w+).*?/
    const shortenedLink = /(?:https)?:\/\/youtu.be\/(\w+).*?/

    const videoIdMatch = query.match(normalLink) ?? query.match(shortenedLink)

    if (videoIdMatch) {
      // yt-search doesn't work that well with actual url:s, let's use
      // ytdl-core for this instead.
      return from(ytdl.getInfo(`${query}&bpctr=9999999999`)).pipe(
        map(r => {
          const details = r.videoDetails

          const toMinutesAndSeconds = (seconds: number) => {
            return `${Math.floor(seconds / 60)}:${seconds % 60}`
          }

          return {
            url: details.video_url,
            title: details.title,
            timestamp: toMinutesAndSeconds(Number(details.lengthSeconds)),
          }
        }),
      )
    } else {
      return from(yts.search(query))
        .pipe(
          map(res => res.videos),
          filter(videos => videos.length > 0),
          map(([ video ]) => video),
        )
    }
  })
}
