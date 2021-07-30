import { expose } from 'threads'
import yts from 'yt-search'

expose({
  async fetchInfo(query: string) {
    if (query.startsWith('http')) {
      const videoIdMatch = query.match(new RegExp(/https:\/\/www.youtube.com\/watch\?.*?v=(\w+).*?/))
      if (videoIdMatch) {
        const [_, videoId] = videoIdMatch
        const res  = await yts.search({ videoId })
        return JSON.stringify(res)
      }
    } else {
      const { videos: [ match ] } = await yts.search(query)
      return JSON.stringify(match)
    }
  }
})
