/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * A Duration can be a number in milliseconds or a string formatted as a duration
 *
 * Formats accepted are :
 * - Simple number in milliseconds
 * - String formatted as a duration. Uses https://github.com/lukeed/ms under the hood
 */
export type Duration = number | string

/**
 * A Broadcastable is a value that can be broadcasted to other clients
 */
export type Broadcastable = Record<string, unknown> | string | number | boolean | null

export interface Transport {
  send(channel: string, payload: any): Promise<void>
  subscribe(channel: string, handler: any): Promise<void>
  unsubscribe(channel: string): Promise<void>
}

export interface TransmitConfig {
  pingInterval?: Duration | false
  transport: null | { driver: new (...args: any[]) => Transport; channel?: string }
}
