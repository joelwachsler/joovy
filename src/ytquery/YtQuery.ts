import { Message } from 'discord.js'
import { runQueryReal } from './impl/Real'

export namespace YtQuery {

  export let runQuery = runQueryReal

  export interface ParseQueryArgs {
    message: Message
  }
}
