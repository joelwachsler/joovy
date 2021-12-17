import { createTestEvent, e, handle, hot } from '../../test/util'

test('should disconnect if connected to channel', () => {
  const play = createTestEvent({
    content: '/play test',
  })
  const disconnect = createTestEvent({
    content: '/disconnect',
  })

  const messages = handle(hot('ab|', { a: play, b: disconnect }))
  expect(messages).toMatchSnapshot()
})

test('should disconnect, reconnect and disconnect again without any problem', () => {
  const play = createTestEvent({
    content: '/play test',
  })
  const disconnect = createTestEvent({
    content: '/disconnect',
  })

  const messages = handle(hot('aba|', { a: play, b: disconnect }))
  expect(messages).toMatchSnapshot()
})

test('should not do anything if not connected to channel', () => {
  const disconnect = createTestEvent({
    content: '/disconnect',
  })

  const messages = handle(hot('a', { a: disconnect }))
  expect(messages).toMatchObject(e('a', {
    a: {
      commandCalled: '/disconnect',
    },
  }))
})