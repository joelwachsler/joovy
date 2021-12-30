import { map, Observable } from 'rxjs'
import { handleMessage } from '../messageHandler'
import { createTestEvent, hot, sandbox } from '../test/util'
import { TRACKING_EVENT } from './PlaylistTracker'

test('should create tracker for playlist', () => {
  const play = createTestEvent({ content: '/play test' })

  const messages = handleTrackingMessages(hot('a', { a: play }))
  expect(messages).toMatchSnapshot()
})

test('should track multiple tracks in the same playlist', () => {
  const play = createTestEvent({ content: '/play test' })
  const play2 = createTestEvent({ content: '/play test2' })

  const messages = handleTrackingMessages(hot('ab', { a: play, b: play2 }))
  expect(messages).toMatchSnapshot()
})

test('should differentiate tracking between playlists', () => {
  const play = createTestEvent({ content: '/play test' })
  const disconnect = createTestEvent({ content: '/disconnect' })

  const messages = handleTrackingMessages(hot('aba', { a: play, b: disconnect }))
  expect(messages).toMatchSnapshot()
})

const handleTrackingMessages = (source: Observable<any>) => sandbox.getMessages(handleMessage(source).pipe(
  map(msg => {
    // include the actual item when matching tracking events
    if (msg.result === TRACKING_EVENT) {
      return msg
    } else {
      return msg.result
    }
  }),
))
