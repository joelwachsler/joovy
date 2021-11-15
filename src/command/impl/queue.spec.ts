import { Message } from 'discord.js'
import { TestUtil } from '../../test/testUtil'
import { Command } from '../command'

test('should send queue request', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/queue' } as Message })
      Command.init(env, sources$)
      expectObservable(env.printQueueRequest).toBe('a-', { a: null })
    })
  })
})
