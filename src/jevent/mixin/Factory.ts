import { Message } from 'discord.js'
import * as Player from '../../player/Player'
import { Factory } from '../Factory'
import { delayFactoryImpl } from '../impl/delay'
import { timeoutFactoryImpl } from '../impl/timeout'
import { UUIDFactoryImpl } from '../impl/uuid'
import { ytSearchFactoryImpl } from '../impl/ytSearch'
import { Constructor } from '../JEvent'

const WithFactory = <TBase extends Constructor>(Base: TBase, message: Message) => {
  return class extends Base implements Factory {
    get player() {
      return Player.from(message)
    }

    get delay() {
      return delayFactoryImpl
    }

    get timeout() {
      return timeoutFactoryImpl
    }

    get ytSearch() {
      return ytSearchFactoryImpl
    }

    get uuid() {
      return UUIDFactoryImpl
    }

    get factory() {
      return this
    }
  }
}

export default WithFactory
