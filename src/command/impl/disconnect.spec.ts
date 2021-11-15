import { Message } from 'discord.js'
import { TestUtil } from '../../test/testUtil'
import { Command } from '../command'

test('should send disconnect message', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/disconnect' } as Message })
      Command.init(env, sources$)
      expectObservable(env.disconnect).toBe('a-', { a: null })
    })
  })
})
