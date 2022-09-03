```plantuml
entity Author {
  discord_id: int
  username: string
}

entity Playlist {
  channel_id: int
  end_of_playlist: bool
}

entity Track {
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
Playlist -- Track: Current track
Track }-- TrackQueryResult
TrackQueryResult --{ TrackQuery: Resulted in track

```