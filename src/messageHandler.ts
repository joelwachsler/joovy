import { mergeMap, Observable, of } from 'rxjs'
import { handle } from './commands/command'
import JEvent from './JEvent'

export const handleMessage = (event$: Observable<JEvent>): Observable<JEvent> => {
  return event$.pipe(
    mergeMap(event => {
      const message = event.message
      if (message.author.bot) {
        return of(event.withResult({ ignored: `${message.content} was sent by a bot` }))
      } else if (!message.content.startsWith('/')) {
        return of(event.withResult({ ignored: `${message.content} does not start with a slash` }))
      } else {
        return handle(event)
      }
    }),
  )
}
