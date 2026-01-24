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

test.group('defineConfig', () => {
  test('should set default transport channel when missing', ({ assert }) => {
    const config = defineConfig({
      pingInterval: false,
      transport: {
        driver: () => null,
      } as any,
    })

    assert.equal(config.transport?.channel, 'transmit::broadcast')
  })

  test('should not override explicit transport channel', ({ assert }) => {
    const config = defineConfig({
      pingInterval: false,
      transport: {
        channel: 'custom',
        driver: () => null,
      } as any,
    })

    assert.equal(config.transport?.channel, 'custom')
  })

  test('should ignore null transport', ({ assert }) => {
    const config = defineConfig({
      pingInterval: false,
      transport: null,
    })

    assert.isNull(config.transport)
  })
})
