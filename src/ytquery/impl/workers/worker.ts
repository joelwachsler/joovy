import { expose } from 'threads'
import yts from 'yt-search'

expose({
  // Using a seperate thread for this because it's costly for some reason...
  async fetchInfo(query: string) {
    const normalLink = /(?:https)?:\/\/www.youtube.com\/watch\?.*?v=(\w+).*?/
    const shortenedLink = /(?:https)?:\/\/youtu.be\/(\w+).*?/

    const videoIdMatch = query.match(normalLink) ?? query.match(shortenedLink)

    if (videoIdMatch) {
      const [_, videoId] = videoIdMatch
      const res  = await yts.search({ videoId })
      return JSON.stringify(res)
    } else {
      const { videos: [ match ] } = await yts.search(query)
      return JSON.stringify(match)
    }
  },
})
