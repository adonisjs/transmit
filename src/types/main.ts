/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export interface Transport {
  send(channel: string, payload: any): Promise<void>
  subscribe(channel: string, handler: any): Promise<void>
  unsubscribe(channel: string): Promise<void>
}

export interface TransmitConfig {
  transport: false | { driver: new (...args: any[]) => Transport; channel?: string }
}
