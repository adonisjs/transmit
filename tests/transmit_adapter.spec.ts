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
import { TransmitAdonisAdapter } from '../src/transmit.js'

test.group('TransmitAdonisAdapter', () => {
  test('should register routes and apply modifier', ({ assert }) => {
    const calls: Array<{
      method: 'get' | 'post'
      path: string
      handler: unknown
      route: { path: string; method: string; modified?: boolean }
    }> = []

    const router = {
      get(path: string, handler: unknown) {
        const route = { path, method: 'GET' }
        calls.push({ method: 'get', path, handler, route })
        return route
      },
      post(path: string, handler: unknown) {
        const route = { path, method: 'POST' }
        calls.push({ method: 'post', path, handler, route })
        return route
      },
    }

    const config = defineConfig({
      pingInterval: false,
      transport: null,
    })

    const adapter = new TransmitAdonisAdapter(config, router as any, null)

    const modified: Array<{ path: string; method: string; modified?: boolean }> = []
    adapter.registerRoutes((route) => {
      // @ts-expect-error - Adding test property
      route.modified = true
      modified.push(route as any)
    })

    assert.equal(calls.length, 3)
    assert.deepEqual(
      calls.map((call) => call.path),
      ['__transmit/events', '__transmit/subscribe', '__transmit/unsubscribe']
    )
    assert.deepEqual(
      calls.map((call) => call.method),
      ['get', 'post', 'post']
    )
    assert.isTrue(calls.every((call) => Array.isArray(call.handler) && call.handler.length === 1))
    assert.equal(modified.length, 3)
    assert.isTrue(modified.every((route) => route.modified))
  })
})
