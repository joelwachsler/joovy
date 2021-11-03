import { FFmpeg, opus as Opus } from 'prism-media'
import ytdl, { downloadOptions as DownloadOptions } from 'ytdl-core'
import { logger } from './logger'

export namespace Ytdl {

  export const createStream = async (args: CreateStreamArgs): Promise<Opus.Encoder> => {
    const transcoder = new FFmpeg({ args: createFfmpegArgs(args) })
    const inputStream = await createYtdlStream(args.url, args.ytdlOptions)
    const output = inputStream.pipe(transcoder)

    const opus = new Opus.Encoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    })

    const outputStream = output.pipe(opus)
    output.on('error', e => outputStream.emit('error', e))

    ytdlEvents.forEach(event => inputStream.on(event, (...args) => outputStream.emit(event, args)))

    outputStream.on('close', () => {
      logger.info('Output stream closed')
      transcoder.destroy()
      opus.destroy()
    })

    return outputStream
  }

  const createYtdlStream = async (url: string, options?: DownloadOptions) => {
    try {
      // add &bpctr=9999999999 to prevent age restriction errors
      const info = await ytdl.getInfo(`${url}&bpctr=9999999999`)
      return ytdl.downloadFromInfo(info, options)
    } catch(e) {
      logger.error(`Failed to create stream: ${e}`)
      throw e
    }
  }

  const ytdlEvents = [
    'abort',
    'error',
    'info',
    'progress',
    'reconnect',
    'redirect',
    'request',
    'response',
    'retry',
  ]

  interface CreateStreamArgs {
    url: string
    options?: StreamOptions
    ytdlOptions?: DownloadOptions
  }

  interface StreamOptions {
    seek?: number
    encoderArgs?: string[]
    fmt?: string
    opusEncoded?: boolean
  }

  const createFfmpegArgs = ({ options }: CreateStreamArgs) => {
    let ffmpegArgs = [
      '-analyzeduration',
      '0',
      '-loglevel',
      '0',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
    ]

    if (options?.seek) {
      ffmpegArgs = ['-ss', options.seek.toString(), ...ffmpegArgs]
    }

    if (options?.encoderArgs) {
      ffmpegArgs = [...ffmpegArgs, ...options.encoderArgs]
    }

    return ffmpegArgs
  }
}
