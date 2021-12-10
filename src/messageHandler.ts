import { EMPTY, filter, mergeMap, Observable, of, switchMap } from 'rxjs';
import { Command, EventWithResult } from './commands/command';
import { Event } from './Event';

export const handleMessage = (event$: Observable<Event>): Observable<EventWithResult> => {
  return event$
    .pipe(
      mergeMap(event => {
        const message = event.message
        if (message.author.bot) {
          return of({
            event,
            result: {
              ignored: `${message.content} was sent by a bot`,
            }
          })
        } else if (!message.content.startsWith('/')) {
          return of({
            event,
            result: {
              ignored: `${message.content} does not start with a slash`,
            }
          })
        } else {
          return Command.handle(event)
        }
      }),
    )
}
