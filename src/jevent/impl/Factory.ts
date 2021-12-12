import { BaseConstructor, Factory } from '../JEvent'
import * as Player from '../../player/Player'
import { Message } from 'discord.js'

const WithFactory = <TBase extends BaseConstructor<Message>>(Base: TBase) => {
  return class extends Base implements Factory {
    get player() {
      return Player.from(this.message)
    }

    get factory() {
      return this
    }
  }
}

export default WithFactory
