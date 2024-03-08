/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Emittery from 'emittery'
import { Bus } from '@rlanz/bus'
import string from '@poppinss/utils/string'
import { Stream } from './stream.js'
import { StreamChannelRepository } from './stream_channel_repository.js'
import { SecureChannelStore } from './secure_channel_store.js'
import type { HttpContext } from '@adonisjs/core/http'
import type { Transport } from '@rlanz/bus/types/main'
import type { Broadcastable, TransmitConfig } from './types/main.js'

interface TransmitLifecycleHooks {
  connect: { uid: string; ctx: HttpContext }
  disconnect: { uid: string; ctx: HttpContext }
  broadcast: { channel: string; payload: Broadcastable }
  subscribe: { uid: string; channel: string; ctx: HttpContext }
  unsubscribe: { uid: string; channel: string; ctx: HttpContext }
}

export class Transmit {
  /**
   * The storage bag instance to store all the streams.
   */
  #storage: StreamChannelRepository

  /**
   * The secure channel store instance to store all the secure channel definitions.
   */
  #secureChannelStore: SecureChannelStore

  /**
   * The secure channel store instance to store all the secure channel callbacks.
   */
  #secureChannelCallbacks: Map<string, (ctx: HttpContext, params?: any) => Promise<boolean>> =
    new Map()

  /**
   * The transport provider to synchronize messages and subscriptions
   * across multiple instance.
   */
  readonly #bus: Bus | null

  /**
   * The config for the transmit instance.
   */
  #config: TransmitConfig

  /**
   * The emittery instance to emit events.
   */
  #emittery: Emittery<TransmitLifecycleHooks>

  constructor(config: TransmitConfig, transport: Transport | null) {
    this.#config = config
    this.#storage = new StreamChannelRepository()
    this.#secureChannelStore = new SecureChannelStore()
    this.#bus = transport ? new Bus(transport, { retryQueue: { enabled: true } }) : null
    this.#emittery = new Emittery()

    void this.#bus?.subscribe<{ channel: string; payload: Broadcastable }>(
      // TODO: Create a computed config type
      this.#config.transport!.channel!,
      (message) => {
        const { channel, payload } = message

        void this.#broadcastLocally(channel, payload)
      }
    )

    if (this.#config.pingInterval) {
      const intervalValue =
        typeof this.#config.pingInterval === 'number'
          ? this.#config.pingInterval
          : string.milliseconds.parse(this.#config.pingInterval)

      setInterval(() => this.#ping(), intervalValue)
    }
  }

  /**
   * Creates and register a new stream for the given request and pipes it to the response.
   */
  $createStream(ctx: HttpContext): void {
    const { request, response } = ctx

    const stream = new Stream(request.input('uid'), request.request)
    stream.pipe(response.response, undefined, response.getHeaders())

    void this.#emittery.emit('connect', { uid: stream.getUid(), ctx })

    this.#storage.push(stream)

    response.response.on('close', () => {
      void this.#emittery.emit('disconnect', { uid: stream.getUid(), ctx })
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

  getClients() {
    return Array.from(this.#storage.getAllSubscribers()).map(([stream]) => stream.getUid())
  }

  getSubscriptionsForClient(uid: string) {
    const channels = this.#storage.getChannelByClient(uid)
    return channels ? Array.from(channels) : []
  }

  async $subscribeToChannel(uid: string, channel: string, ctx: HttpContext): Promise<boolean> {
    const definitions = this.#secureChannelStore.match(channel)

    if (definitions) {
      const callback = this.#secureChannelCallbacks.get(definitions.url)

      if (!callback) {
        return false
      }

      try {
        const result = await callback(ctx, definitions.params)

        if (!result) {
          ctx.response.forbidden()
          return false
        }
      } catch (e) {
        ctx.response.internalServerError()
        return false
      }
    }

    void this.#emittery.emit('subscribe', { uid, channel, ctx })

    return this.#storage.addChannelToStream(uid, channel)
  }

  $unsubscribeFromChannel(uid: string, channel: string, ctx: HttpContext): boolean {
    void this.#emittery.emit('unsubscribe', { uid, channel, ctx })

    return this.#storage.removeChannelFromStream(uid, channel)
  }

  #ping() {
    this.#storage.getAllSubscribers()

    for (const [stream] of this.#storage.getAllSubscribers()) {
      stream.writeMessage({ data: { channel: '$$transmit/ping', payload: {} } })
    }
  }

  #broadcastLocally(channel: string, payload: Broadcastable, senderUid?: string | string[]) {
    const subscribers = this.#storage.findByChannel(channel)

    for (const subscriber of subscribers) {
      if (
        Array.isArray(senderUid)
          ? senderUid.includes(subscriber.getUid())
          : senderUid === subscriber.getUid()
      ) {
        continue
      }

      subscriber.writeMessage({ data: { channel, payload } })
    }
  }

  broadcastExcept(channel: string, payload: Broadcastable, senderUid: string | string[]) {
    return this.#broadcastLocally(channel, payload, senderUid)
  }

  broadcast(channel: string, payload?: Broadcastable) {
    if (!payload) {
      payload = {}
    }

    void this.#bus?.publish(this.#config.transport!.channel!, {
      channel,
      payload,
    })

    this.#broadcastLocally(channel, payload)

    void this.#emittery.emit('broadcast', { channel, payload })
  }

  closeBusConnection() {
    return this.#bus?.disconnect()
  }

  on<T extends keyof TransmitLifecycleHooks>(
    event: T,
    callback: (payload: TransmitLifecycleHooks[T]) => void
  ) {
    return this.#emittery.on(event, callback)
  }
}
