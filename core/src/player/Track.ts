import JEvent from '../jevent/JEvent'
import { YtSearchResult } from '../jevent/YtSearchResult'

export default interface Track {
  name: string
  link: string
  removed: boolean
}

interface TrackArgs {
  event: JEvent
  info: YtSearchResult
}

export const from = ({ event, info }: TrackArgs): Track => {
  return {
    link: info.url,
    name: `[${info.title} (${info.timestamp})](${info.url}) [<@${event.message.author.id}>]`,
    removed: false,
  }
}
