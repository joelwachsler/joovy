import { Message } from 'discord.js'
import { Subject } from 'rxjs'
import { ErrorMessageArgs, messageHandler } from './connectionHandler'
import { TestUtil } from './test/testUtil'

test('should ignore messages not starting with a slash', () => {
  TestUtil.setupTest(({ scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const source$ = hot<Message>('a-', { a: { content: 'play test', author: { bot: false } } as Message })
      expectObservable(messageHandler(source$, new Subject)).toBe('--')
    })
  })
})

test('should ignore bot messages', () => {
  TestUtil.setupTest(({ scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const source$ = hot<Message>('a-', { a: { content: '/play test', author: { bot: true } } as Message })
      expectObservable(messageHandler(source$, new Subject())).toBe('--')
    })
  })
})

test('should send error message when user is not joined to channel', () => {
  TestUtil.setupTest(({ scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const message = {
        content: '/play test',
        author: {
          bot: false,
        },
      } as Message

      const source$ = hot<Message>('a-', { a: message } )
      const errorMessageSubject = new Subject<ErrorMessageArgs>()

      expectObservable(messageHandler(source$, errorMessageSubject)).toBe('--')
      expectObservable(errorMessageSubject).toBe(
        'a-',
        {
          a: {
            description: 'Could not determine which channel you are in, have you joined one?',
            message,
          }
        }
      )
    })
  })
})
