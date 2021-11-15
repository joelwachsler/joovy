import { Message } from 'discord.js'
import { TestUtil } from '../../test/testUtil'
import { Command } from '../command'

test('skip should send nextTrackInPlaylist', () => {
  TestUtil.setupTest(({ env, scheduler }) => {
    scheduler.run(({ expectObservable, hot }) => {
      const sources$ = hot<Message>('a-', { a: { content: '/skip' } as Message })
      Command.init(env, sources$)
      expectObservable(env.nextTrackInPlaylist).toBe('a-', { a: null })
    })
  })
})
