import { Message } from 'discord.js'
import { TestUtil } from '../../test/testUtil'
import { Command } from '../command'

test('should send remove message', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/remove 1' } as Message })
      Command.init(env, sources$)
      expectObservable(env.removeFromQueue).toBe('a-', { a: { from: 1, to: 1 } })
    })
  })
})

test('should send range of remove messages', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/remove 1 5' } as Message })
      Command.init(env, sources$)
      expectObservable(env.removeFromQueue).toBe('a-', { a: { from: 1, to: 5 } })
    })
  })
})
