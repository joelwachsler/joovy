import * as Player from '../player/Player'
import { delayFactoryImpl } from './impl/delay'
import { timeoutFactoryImpl } from './impl/timeout'
import { ytSearchFactoryImpl } from './impl/ytSearch'

export interface Factory {
  readonly factory: {
    readonly player: Player.Factory
    readonly delay: DelayFactory
    readonly timeout: TimeoutFactory
    readonly ytSearch: YtSearchFactory
  }
}

export type DelayFactory = typeof delayFactoryImpl

export type TimeoutFactory = typeof timeoutFactoryImpl

export type YtSearchFactory = typeof ytSearchFactoryImpl
