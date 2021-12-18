import { Message } from 'discord.js'
import * as Player from '../../player/Player'
import { BaseConstructor, delayFactoryImpl, Factory, ytSearchFactoryImpl } from '../JEvent'

const WithFactory = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements Factory {
    get player() {
      return Player.from(this.message)
    }

    get delay() {
      return delayFactoryImpl
    }

    get ytSearch() {
      return ytSearchFactoryImpl
    }

    get factory() {
      return this
    }
  }
}

export default WithFactory
