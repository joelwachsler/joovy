import { Observable } from 'rxjs'
import { Result } from './jevent/Result'
import logger from './logger'

export const logResult = (handler: string, result: Observable<Result>) => {
  return result.subscribe(({ result, event }) => {
    logger.info(`${event.message.content} by ${event.message.author.id} (${event.message.author.username}) has been handled by ${handler} with result: ${result ? JSON.stringify(result) : result}`)
  })
}