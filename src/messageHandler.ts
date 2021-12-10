import { filter, Observable } from 'rxjs';
import { Environment } from './Environment';

export const handleMessage = (msgEvent$: Observable<Environment>) => {
  return msgEvent$
    .pipe(
      filter(({ message }) => !message.author.bot),
      filter(({ message }) => message.content.startsWith('/')),
    )
}
