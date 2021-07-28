import winston from 'winston'

const initLogger = () => {
  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        )
      }),
    ]
  })
}

export const logger = initLogger()
