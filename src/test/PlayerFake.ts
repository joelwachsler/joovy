import { defer, Observable, of, SchedulerLike, Subject, timeout } from 'rxjs'
import Player, { Track } from '../player/Player'

export class PlayerFake implements Player {
  private playing = new Subject<Track>()

  constructor(private scheduler: SchedulerLike) { }

  idle(cancel$: Observable<void>): Observable<void> {
    return new Observable(subscribe => {
      const timeout$ = timeout({
        each: 5,
        scheduler: this.scheduler,
        with: () => of(undefined),
      })

      cancel$.pipe(timeout$).subscribe(() => {
        subscribe.next()
        subscribe.complete()
      })
    })
  }

  play(track: Track): Observable<Track> {
    return defer(() => {
      this.playing.next(track)
      return of(track)
    })
  }

  disconnect(): void {
    return undefined
  }
}
