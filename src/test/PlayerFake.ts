import { delay, Observable, of, SchedulerLike, Subject } from 'rxjs'
import Player, { Track } from '../player/Player'

export class PlayerFake implements Player {
  private playing = new Subject<Track>()

  constructor(private scheduler: SchedulerLike) { }

  idle(): Observable<void> {
    return of(undefined).pipe(
      delay(5, this.scheduler),
    )
  }

  play(track: Track): Observable<Track> {
    this.playing.next(track)
    return of(track)
  }

  disconnect(): void {
    return undefined
  }
}
