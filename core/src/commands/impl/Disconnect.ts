import { mergeMap, Observable } from 'rxjs'
import { createDisconnectMessage } from '../../disconnect'
import JEvent from '../../jevent/JEvent'
import { Result } from '../../jevent/Result'
import { createProducer, Topics } from '../../kafka/kafka'
import ArgParser from '../ArgParser'
import Command from '../command'

export default class Disconnect implements Command {
  argument = ArgParser.create('disconnect')
  helpText = 'Disconnects the bot from the current channel.'

  handleMessage(event: JEvent): Observable<Result> {
    return createProducer().pipe(mergeMap(producer => {
      return producer.send({
        topic: Topics.Disconnect,
        event,
        message: createDisconnectMessage(event),
      })
    }))
  }
}
