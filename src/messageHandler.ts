import { mergeMap, Observable, of } from 'rxjs';
import { Command } from './commands/command';
import { Event } from './Event';

export const handleMessage = (event$: Observable<Event>): Observable<Event> => {
  return event$
    .pipe(
      mergeMap(event => {
        const message = event.message
        if (message.author.bot) {
          return of(event.withResult({ ignored: `${message.content} was sent by a bot` }))
        } else if (!message.content.startsWith('/')) {
          return of(event.withResult({ ignored: `${message.content} does not start with a slash` }))
        } else {
          return Command.handle(event)
        }
      }),
    )
}
