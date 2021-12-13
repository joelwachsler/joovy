import { catchError, mergeMap, Observable } from 'rxjs'
import { handle } from './commands/command'
import JEvent, { ResultEntry } from './jevent/JEvent'

export const handleMessage = (event$: Observable<JEvent>): Observable<ResultEntry> => {
  return event$.pipe(
    mergeMap(event => {
      const message = event.message
      if (message.author.bot) {
        return event.result({ ignored: `${message.content} was sent by a bot` })
      } else if (!message.content.startsWith('/')) {
        return event.result({ ignored: `${message.content} does not start with a slash` })
      } else {
        return handle(event)
          .pipe(catchError(err => event.sendMessage(err.message)))
      }
    }),
  )
}
