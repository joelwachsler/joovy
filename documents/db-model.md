```plantuml
entity Author {
  discord_id: int
  username: string
}

entity Playlist {
  channel_id: int
}

entity Track {
  index: int
  skip: bool
}

entity TrackQuery {
  query: string
}

entity TrackQueryResult {
  title: string
  url: string
  duration: int
}

Author --{ Track: Requester
Playlist -{ Track: Playlist tracks
Track }-- TrackQueryResult
TrackQueryResult --{ TrackQuery: Resulted in track

```