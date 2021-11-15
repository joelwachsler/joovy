import { Message } from 'discord.js'
import { TestUtil } from '../test/testUtil'
import { Command } from './command'

test('should do stuff', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/bass 10' } as Message })
      Command.init(env, sources$)
      expectObservable(env.setBassLevel).toBe('a-', { a: 10 })
    })
  })
})
