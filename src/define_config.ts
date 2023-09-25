/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TransmitConfig } from './types/main.js'

export function defineConfig<T extends TransmitConfig>(config: T): T {
  if (config.transport && typeof config.transport.channel === 'undefined') {
    config.transport.channel = 'transmit::broadcast'
  }

  return config
}
