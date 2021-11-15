import { Message } from 'discord.js'
import { TestUtil } from '../../test/testUtil'
import { Command } from '../command'

test('should send seek request using seconds', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/seek 10' } as Message })
      Command.init(env, sources$)
      expectObservable(env.seek).toBe('a-', { a: 10 })
    })
  })
})

test('should send seek request using seconds and minutes', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/seek 1:10' } as Message })
      Command.init(env, sources$)
      expectObservable(env.seek).toBe('a-', { a: 70 })
    })
  })
})
