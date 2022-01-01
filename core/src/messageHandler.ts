import { catchError, filter, mergeMap, Observable } from 'rxjs'
import { handle } from './commands/command'
import { errorHandler } from './errorHandler'
import JEvent from './jevent/JEvent'
import { EmptyResult, Result } from './jevent/Result'

export const handleMessage = (event: Observable<JEvent>): Observable<Result> => {
  return event.pipe(
    mergeMap(event => {
      const message = event.message
      if (message.author.bot) {
        return event.result({ ignored: `${message.content} was sent by a bot` })
      } else if (!message.content.startsWith('/')) {
        return event.result({ ignored: `${message.content} does not start with a slash` })
      } else {
        return handle(event).pipe(
          filter(r => !(r instanceof EmptyResult)),
          catchError(err => errorHandler(event, err)),
        )
      }
    }),
  )
}
