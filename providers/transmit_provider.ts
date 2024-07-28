/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import '../src/types/extended.js'
import { TransmitAdonisAdapter } from '../src/transmit.js'
import type { ApplicationService } from '@adonisjs/core/types'
import type { Transport } from '@boringnode/bus/types/main'
import type { TransmitConfig } from '@boringnode/transmit/types'

export default class TransmitProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('transmit', async () => {
      const router = await this.app.container.make('router')
      const config = this.app.config.get<TransmitConfig>('transmit', {})

      let transport: Transport | null = null

      if (config.transport) {
        transport = config.transport.driver()
      }

      return new TransmitAdonisAdapter(config, router, transport)
    })
  }

  async shutdown() {
    const transmit = await this.app.container.make('transmit')

    await transmit.shutdown()
  }
}
