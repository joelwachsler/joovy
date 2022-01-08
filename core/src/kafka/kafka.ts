import { Kafka, Producer } from 'kafkajs'
import { defer, from, mapTo, mergeMap, mergeMapTo, Observable, tap } from 'rxjs'
import initConfig from '../config'
import JEvent from '../jevent/JEvent'
import { Result } from '../jevent/Result'
import { MessageKey } from '../JMessage'
import logger from '../logger'

class KafkaProducerImpl implements KafkaProducer {
  constructor(private producer: Producer) { }

  send({ message, topic, key, event }: SendArgs): Observable<Result> {
    return defer(() => {
      return from(this.producer.send({
        topic,
        messages: [{
          key,
          value: JSON.stringify(message),
        }],
      })).pipe(
        mergeMapTo(event.result({ kafka: message })),
      )
    })
  }
}

export interface KafkaProducer {
  send(args: SendArgs): Observable<Result>
}

export enum Topics {
  NewMessage = 'joovy-new-message',
}

export interface SendArgs<Message = KMessage> {
  topic: string
  key?: string
  message: Message
  event: JEvent
}

export interface KMessage<Name = string, Version = string> {
  meta: KMeta<Name, Version>
  [props: string]: unknown
}

export interface KMeta<Name = string, Version = string> {
  name: Name
  version: Version
  messageKey: MessageKey
}

let kafka: Kafka
let producer: Producer

export const createProducer = () => {
  return new Observable<KafkaProducer>(subscribe => {
    if (!producer) {
      logger.info('Initializing kafka...')
      producer = createKafkaClient().producer()
      producer.on('producer.connect', () => {
        logger.info('Kafka has been initialized!')
      })
    }

    producer.connect().then(() => {
      subscribe.next(new KafkaProducerImpl(producer))
      subscribe.complete()
    })
  })
}

const createKafkaClient = () => {
  if (!kafka) {
    const kafkaConfig = initConfig().kafka

    kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
    })
  }

  return kafka
}

type CreateConsumerArgs = {
  topic: string
  groupId: string
}

export const createConsumer = <T extends KMessage = KMessage>(args: CreateConsumerArgs) => {
  const { groupId, topic } = args

  const create = defer(() => {
    logger.info(`Creating consumer with the following args: ${JSON.stringify(args)}`)
    const consumer = createKafkaClient().consumer({ groupId })

    return from(consumer.connect()).pipe(mapTo(consumer))
  })

  const connectToTopic = create.pipe(mergeMap(consumer => {
    logger.info(`Subscribing to topic: ${topic}...`)
    return from(consumer.subscribe({ topic, fromBeginning: true })).pipe(
      tap(() => logger.info(`Subscribed to topic: ${topic}!`)),
      mapTo(consumer),
    )
  }))

  return connectToTopic.pipe(mergeMap(consumer => {
    return new Observable<T>(subscribe => {
      consumer.run({
        async eachMessage({ message, topic }) {
          const msgAsString = message.value?.toString()
          if (!msgAsString) {
            logger.error(`Invalid message: ${message} for topic: ${topic}`)
            return
          }

          logger.info(`New incoming message: ${JSON.stringify(msgAsString)} on topic: ${topic}`)

          subscribe.next(JSON.parse(msgAsString))
        },
      })
    })
  }))
}
