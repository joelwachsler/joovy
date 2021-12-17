import { createTestEvent, e, handle, hot } from './test/util'

describe('message filtering', () => {
  it('should ignore bot messages', () =>  {
    const event = createTestEvent({
      author: {
        username: 'testuser',
        bot: true,
        id: 'testAuthorId',
      },
      content: '/test',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchObject(e('a|', {
      a: {
        ignored: '/test was sent by a bot',
      },
    }))
  })

  it('should ignore messages not starting with a slash', () => {
    const event = createTestEvent({
      content: 'test',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchObject(e('a|', {
      a: {
        ignored: 'test does not start with a slash',
      },
    }))
  })
})

describe('player creation', () => {
  it('should create player if not previously created', () => {
    const event = createTestEvent({
      content: '/play test',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchSnapshot()
  })

  it('should not create player if previously created', () => {
    const play = createTestEvent({
      content: '/play test',
    })

    const playAgain = createTestEvent({
      content: '/play test2',
    })

    const messages = handle(hot('ab|', { a: play, b: playAgain }))
    expect(messages).toMatchSnapshot()
  })
})

describe('misc commands', () => {
  it('invalid command should call help', () => {
    const event = createTestEvent({
      content: '/invalid command',
    })

    const messages = handle(hot('a|', { a: event }))
    expect(messages).toMatchSnapshot()
  })
})

describe('disconnection', () => {
  it('should disconnect if connected to channel', () => {
    const play = createTestEvent({
      content: '/play test',
    })
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('ab|', { a: play, b: disconnect }))
    expect(messages).toMatchSnapshot()
  })

  it('should disconnect, reconnect and disconnect again without any problem', () => {
    const play = createTestEvent({
      content: '/play test',
    })
    const disconnect = createTestEvent({
      content: '/disconnect',
    })

    const messages = handle(hot('aba|', { a: play, b: disconnect }))
    expect(messages).toMatchSnapshot()
  })

  it('should not do anything if not connected to channel', () => {
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
})

describe('playlist', () => {
  it('should queue song if another one is already playing', () => {
    const play = createTestEvent({ content: '/play test' })
    const playAgain = createTestEvent({ content: '/play test2' })
    const playAgainAgain = createTestEvent({ content: '/play test3' })

    const messages = handle(hot('abc', { a: play, b: playAgain, c: playAgainAgain }))
    expect(messages).toMatchSnapshot()
  })

  it('should print queue with no tracks', () => {
    const queue = createTestEvent({ content: '/queue' })

    const messages = handle(hot('a', { a: queue }))
    expect(messages).toMatchSnapshot()
  })

  it('should print queue', () => {
    const play = createTestEvent({ content: '/play test' })
    const queue = createTestEvent({ content: '/queue' })

    const messages = handle(hot('ab', { a: play, b: queue }))
    expect(messages).toMatchSnapshot()
  })

  it('should print queue with multiple tracks', () => {
    const play = createTestEvent({ content: '/play test' })
    const playAnotherTrack = createTestEvent({ content: '/play test2' })
    const queue = createTestEvent({ content: '/queue' })

    const messages = handle(hot('abc', { a: play, b: playAnotherTrack, c: queue }))
    expect(messages).toMatchSnapshot()
  })

  it('should mark the current track the user is listening to', () => {
    const play = createTestEvent({ content: '/play test' })
    const playAnotherTrack = createTestEvent({ content: '/play test2' })
    const queue = createTestEvent({ content: '/queue' })

    // each track is 5 frames long, move to the frame after next track has started
    // i.e. frame 6 (ab = 2 frames + 4 frames = 6)
    const messages = handle(hot('ab----c', { a: play, b: playAnotherTrack, c: queue }))
    expect(messages).toMatchSnapshot()
  })
})
