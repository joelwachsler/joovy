import { MessageEmbed } from 'discord.js'
import { Observable } from 'rxjs'
import { Result } from './Result'

export interface SendMessage {
  sendMessage(message: string | MessageEmbed): Observable<Result>
}
