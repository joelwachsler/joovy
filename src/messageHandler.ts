import { filter, mergeMap, Observable } from 'rxjs';
import { Command, EventWithResult } from './commands/command';
import { Event } from './Event';

export const handleMessage = (event$: Observable<Event>): Observable<EventWithResult> => {
  return event$
    .pipe(
      filter(({ message }) => !message.author.bot),
      filter(({ message }) => message.content.startsWith('/')),
      mergeMap(event => Command.handle(event)),
    )
}
