/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Emittery from 'emittery'
import { Stream } from './stream.js'
import { StorageBag } from './storage_bag.js'
import { SecureChannelStore } from './secure_channel_store.js'
import type { HttpContext, Request, Response } from '@adonisjs/core/http'

interface TransmitHooks {
  connect: { uid: string }
  disconnect: { uid: string }
  broadcast: { channel: string; payload: Record<string, unknown> }
  subscribe: { uid: string; channel: string }
  unsubscribe: { uid: string; channel: string }
}

export class Transmit extends Emittery<TransmitHooks> {
  /**
   * The storage bag instance to store all the streams.
   */
  #storage: StorageBag

  /**
   * The secure channel store instance to store all the secure channel definitions.
   */
  #secureChannelStore: SecureChannelStore

  /**
   * The secure channel store instance to store all the secure channel callbacks.
   */
  #secureChannelCallbacks: Map<string, (ctx: HttpContext, params?: any) => Promise<boolean>> =
    new Map()

  constructor() {
    super()

    this.#storage = new StorageBag()
    this.#secureChannelStore = new SecureChannelStore()
  }

  /**
   * Creates and register a new stream for the given request and pipes it to the response.
   */
  createStream(request: Request, response: Response): void {
    const stream = new Stream(request.input('uid'), request.request)
    stream.pipe(response.response)

    void this.emit('connect', { uid: stream.getUid() })

    this.#storage.push(stream)

    response.response.on('close', () => {
      void this.emit('disconnect', { uid: stream.getUid() })
      this.#storage.remove(stream)
    })

    response.stream(stream)
  }

  /**
   * Store the authorization callback for the given channel.
   */
  authorizeChannel<T = undefined>(
    channel: string,
    callback: (ctx: HttpContext, params: T) => Promise<boolean>
  ) {
    this.#secureChannelStore.add(channel)
    this.#secureChannelCallbacks.set(channel, callback)
  }

  async subscribeToChannel(uid: string, channel: string, ctx: HttpContext): Promise<boolean> {
    const definitions = this.#secureChannelStore.match(channel)

    if (definitions) {
      const callback = this.#secureChannelCallbacks.get(definitions.url)

      if (!callback) {
        return false
      }

      const result = await callback(ctx, definitions.params)

      if (!result) {
        return false
      }
    }

    void this.emit('subscribe', { uid, channel })

    return this.#storage.addChannelToStream(uid, channel)
  }

  unsubscribeFromChannel(uid: string, channel: string): boolean {
    void this.emit('unsubscribe', { uid, channel })

    return this.#storage.removeChannelFromStream(uid, channel)
  }

  broadcast(channel: string, payload: Record<string, unknown>) {
    const subscribers = this.#storage.findByChannel(channel)

    for (const subscriber of subscribers) {
      subscriber.writeMessage({ data: { channel, payload } })
    }

    void this.emit('broadcast', { channel, payload })
  }
}
