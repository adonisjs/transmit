/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { PubSubChannelHandler, RedisService } from '@adonisjs/redis/types'
import type { Transport } from '../types/main.js'

export class RedisTransport implements Transport {
  #client!: RedisService

  constructor(redis: RedisService) {
    this.#client = redis
  }

  async send(channel: string, payload: any): Promise<void> {
    await this.#client.publish(channel, JSON.stringify(payload))
  }

  subscribe(channel: string, handler: PubSubChannelHandler): Promise<void> {
    return Promise.resolve(this.#client.subscribe(channel, handler))
  }

  unsubscribe(channel: string): Promise<void> {
    return Promise.resolve(this.#client.unsubscribe(channel))
  }
}
