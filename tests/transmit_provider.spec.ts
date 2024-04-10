/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { setupApp } from '../test_helpers/index.js'
import { Route } from '@adonisjs/core/http'

test.group('Provider', () => {
  test('register routes', async ({ assert }) => {
    const app = await setupApp()

    const router = await app.container.make('router')

    assert.equal(router.routes.length, 3)
    assert.instanceOf(router.routes[0], Route)
    assert.instanceOf(router.routes[1], Route)
    assert.instanceOf(router.routes[2], Route)
    assert.equal((router.routes[0] as Route).getPattern(), '__transmit/events')
    assert.equal((router.routes[1] as Route).getPattern(), '__transmit/subscribe')
    assert.equal((router.routes[2] as Route).getPattern(), '__transmit/unsubscribe')
  })

  test('allow to customize the domain of the routes', async ({ assert }) => {
    const app = await setupApp({
      transmit: {
        transport: null,
        routeHandlerDomain: 'example.com',
      },
    })

    const router = await app.container.make('router')

    const route1Json = (router.routes[0] as Route).toJSON()
    const route2Json = (router.routes[1] as Route).toJSON()
    const route3Json = (router.routes[2] as Route).toJSON()

    assert.equal(router.routes.length, 3)
    assert.equal(route1Json.domain, 'example.com')
    assert.equal(route2Json.domain, 'example.com')
    assert.equal(route3Json.domain, 'example.com')
  })
})
