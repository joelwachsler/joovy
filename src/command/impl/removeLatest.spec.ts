import { Message } from 'discord.js'
import { TestUtil } from '../../test/testUtil'
import { Command } from '../command'

test('should send removeLatests', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/removelatests' } as Message })
      Command.init(env, sources$)
      expectObservable(env.removeLatestFromQueue).toBe('a-', { a: null })
    })
  })
})
