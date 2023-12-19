import { Writable } from 'node:stream'
import type { HeaderStream } from '../src/stream.js'

export class Sink extends Writable implements HeaderStream {
  #chunks: Buffer[] = []

  constructor() {
    super({ objectMode: true })
  }

  assertWriteHead(assertion: (statusCode: number, headers: any) => void) {
    // @ts-expect-error - Mocking the writeHead method
    this.writeHead = (statusCode, headers) => {
      assertion(statusCode, headers)
    }
  }

  get content() {
    return this.#chunks.join('')
  }

  _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.#chunks.push(chunk)
    callback()
  }
}
