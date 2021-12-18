import * as Player from '../player/Player'
import { delayFactoryImpl } from './impl/delay'
import { ytSearchFactoryImpl } from './impl/ytSearch'

export interface Factory {
  readonly factory: {
    readonly player: Player.Factory
    readonly delay: DelayFactory
    readonly ytSearch: YtSearchFactory
  }
}

export type DelayFactory = typeof delayFactoryImpl

export type YtSearchFactory = typeof ytSearchFactoryImpl
