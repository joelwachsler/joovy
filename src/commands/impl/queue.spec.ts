import { createTestEvent, handle, hot } from '../../test/util'

test('should queue song if another one is already playing', () => {
  const play = createTestEvent({ content: '/play test' })
  const playAgain = createTestEvent({ content: '/play test2' })
  const playAgainAgain = createTestEvent({ content: '/play test3' })

  const messages = handle(hot('abc', { a: play, b: playAgain, c: playAgainAgain }))
  expect(messages).toMatchSnapshot()
})

test('should print queue with no tracks', () => {
  const queue = createTestEvent({ content: '/queue' })

  const messages = handle(hot('a', { a: queue }))
  expect(messages).toMatchSnapshot()
})

test('should print queue', () => {
  const play = createTestEvent({ content: '/play test' })
  const queue = createTestEvent({ content: '/queue' })

  const messages = handle(hot('ab', { a: play, b: queue }))
  expect(messages).toMatchSnapshot()
})

test('should print queue with multiple tracks', () => {
  const play = createTestEvent({ content: '/play test' })
  const playAnotherTrack = createTestEvent({ content: '/play test2' })
  const queue = createTestEvent({ content: '/queue' })

  const messages = handle(hot('abc', { a: play, b: playAnotherTrack, c: queue }))
  expect(messages).toMatchSnapshot()
})

test('should mark the current track the user is listening to', () => {
  const play = createTestEvent({ content: '/play test' })
  const playAnotherTrack = createTestEvent({ content: '/play test2' })
  const queue = createTestEvent({ content: '/queue' })

  // each track is 5 frames long, move to the frame after next track has started
  // i.e. frame 6 (ab = 2 frames + 4 frames = 6)
  const messages = handle(hot('ab----c', { a: play, b: playAnotherTrack, c: queue }))
  expect(messages).toMatchSnapshot()
})