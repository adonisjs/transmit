import { Socket } from 'node:net'

export class FakeSocket extends Socket {
  #keepAlive = false
  #noDelay = false
  #timeout = 0

  getKeepAlive() {
    return this.#keepAlive
  }

  getNoDelay() {
    return this.#noDelay
  }

  getTimeout() {
    return this.#timeout
  }

  setKeepAlive(enable?: boolean, initialDelay?: number): this {
    this.#keepAlive = enable === true
    return super.setKeepAlive(enable, initialDelay)
  }

  setNoDelay(noDelay?: boolean): this {
    this.#noDelay = noDelay === true
    return super.setNoDelay(noDelay)
  }

  setTimeout(timeout: number, callback?: () => void): this {
    this.#timeout = timeout
    return super.setTimeout(timeout, callback)
  }
}
