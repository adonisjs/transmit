/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { defineConfig } from '../index.js'
import TransmitProvider from '../providers/transmit_provider.js'
import { setupApp } from './helpers.js'

test.group('Provider', () => {
  test('should resolve transmit from container', async ({ assert }) => {
    const app = await setupApp()

    const transmit = await app.container.make('transmit')

    assert.isDefined(transmit)
    assert.isFunction(transmit.broadcast)
  })

  test('should call transport driver when resolving transmit', async ({ assert }) => {
    let driverCalls = 0

    const app = await setupApp('web', {
      transmit: defineConfig({
        pingInterval: false,
        transport: {
          driver: () => {
            driverCalls++
            return null
          },
        } as any,
      }),
    })

    await app.container.make('transmit')

    assert.equal(driverCalls, 1)
  })

  test('should call shutdown on provider shutdown', async ({ assert }) => {
    const app = await setupApp()
    const transmit = await app.container.make('transmit')

    let shutdownCalls = 0
    const originalShutdown = transmit.shutdown
    transmit.shutdown = async () => {
      shutdownCalls++
    }

    const provider = new TransmitProvider(app)
    await provider.shutdown()

    transmit.shutdown = originalShutdown
    assert.equal(shutdownCalls, 1)
  })
})
