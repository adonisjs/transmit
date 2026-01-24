/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Readable } from 'node:stream'
import { test, getActiveTest } from '@japa/runner'
import { setupApp } from './helpers.js'

test.group('Controllers', (group) => {
  let app: Awaited<ReturnType<typeof setupApp>>

  group.setup(async () => {
    app = await setupApp()
  })

  group.teardown(async () => {
    await app.terminate()
  })

  test('event stream should require uid', async ({ assert }) => {
    const { default: EventStreamController } =
      await import('../src/controllers/event_stream_controller.js')

    const controller = new EventStreamController()
    const ctx = {
      request: {
        input: () => undefined,
      },
      response: {
        getHeaders: () => ({}),
        stream: () => {},
      },
    }

    const fn = () => controller.handle(ctx as any)
    assert.throws(fn, 'Missing required field "uid"')
  })

  test('event stream should create and stream the response', async ({ assert }) => {
    const { default: transmit } = await import('../services/transmit.js')
    const originalCreateStream = transmit.createStream

    const stream = Readable.from([])
    let payload: any
    transmit.createStream = ((options: any) => {
      payload = options
      return stream
    }) as any

    getActiveTest()?.cleanup(() => {
      transmit.createStream = originalCreateStream
    })

    const { default: EventStreamController } =
      await import('../src/controllers/event_stream_controller.js')
    const controller = new EventStreamController()

    let streamed: unknown
    const ctx = {
      request: {
        input: (key: string) => (key === 'uid' ? 'user-1' : undefined),
        request: { requestId: 'req-1' },
      },
      response: {
        response: { responseId: 'res-1' },
        getHeaders: () => ({ foo: 'bar' }),
        stream: (value: unknown) => {
          streamed = value
          return 'streamed'
        },
      },
    }

    const result = controller.handle(ctx as any)

    assert.equal(result, 'streamed')
    assert.equal(streamed, stream)
    assert.deepEqual(payload, {
      uid: 'user-1',
      context: ctx,
      request: ctx.request.request,
      response: ctx.response.response,
      injectResponseHeaders: { foo: 'bar' },
    })
  })

  test('subscribe should return badRequest when subscribe fails', async ({ assert }) => {
    const { default: transmit } = await import('../services/transmit.js')
    const originalSubscribe = transmit.subscribe

    let payload: any
    transmit.subscribe = (async (options: any) => {
      payload = options
      return false
    }) as any

    getActiveTest()?.cleanup(() => {
      transmit.subscribe = originalSubscribe
    })

    const { default: SubscribeController } =
      await import('../src/controllers/subscribe_controller.js')
    const controller = new SubscribeController()

    let badRequestCalls = 0
    let noContentCalls = 0
    const ctx = {
      request: {
        input: (key: string) => (key === 'uid' ? 'user-1' : 'news'),
      },
      response: {
        badRequest: () => {
          badRequestCalls++
          return 'bad-request'
        },
        noContent: () => {
          noContentCalls++
          return 'no-content'
        },
      },
    }

    const result = await controller.handle(ctx as any)

    assert.equal(result, 'bad-request')
    assert.equal(badRequestCalls, 1)
    assert.equal(noContentCalls, 0)
    assert.deepEqual(payload, {
      uid: 'user-1',
      channel: 'news',
      context: ctx,
    })
  })

  test('subscribe should return noContent when subscribe succeeds', async ({ assert }) => {
    const { default: transmit } = await import('../services/transmit.js')
    const originalSubscribe = transmit.subscribe

    let payload: any
    transmit.subscribe = (async (options: any) => {
      payload = options
      return true
    }) as any

    getActiveTest()?.cleanup(() => {
      transmit.subscribe = originalSubscribe
    })

    const { default: SubscribeController } =
      await import('../src/controllers/subscribe_controller.js')
    const controller = new SubscribeController()

    let badRequestCalls = 0
    let noContentCalls = 0
    const ctx = {
      request: {
        input: (key: string) => (key === 'uid' ? 'user-2' : 'updates'),
      },
      response: {
        badRequest: () => {
          badRequestCalls++
          return 'bad-request'
        },
        noContent: () => {
          noContentCalls++
          return 'no-content'
        },
      },
    }

    const result = await controller.handle(ctx as any)

    assert.equal(result, 'no-content')
    assert.equal(badRequestCalls, 0)
    assert.equal(noContentCalls, 1)
    assert.deepEqual(payload, {
      uid: 'user-2',
      channel: 'updates',
      context: ctx,
    })
  })

  test('unsubscribe should return badRequest when unsubscribe fails', async ({ assert }) => {
    const { default: transmit } = await import('../services/transmit.js')
    const originalUnsubscribe = transmit.unsubscribe

    let payload: any
    transmit.unsubscribe = (async (options: any) => {
      payload = options
      return false
    }) as any

    getActiveTest()?.cleanup(() => {
      transmit.unsubscribe = originalUnsubscribe
    })

    const { default: UnsubscribeController } =
      await import('../src/controllers/unsubscribe_controller.js')
    const controller = new UnsubscribeController()

    let badRequestCalls = 0
    let noContentCalls = 0
    const ctx = {
      request: {
        input: (key: string) => (key === 'uid' ? 'user-3' : 'alerts'),
      },
      response: {
        badRequest: () => {
          badRequestCalls++
          return 'bad-request'
        },
        noContent: () => {
          noContentCalls++
          return 'no-content'
        },
      },
    }

    const result = await controller.handle(ctx as any)

    assert.equal(result, 'bad-request')
    assert.equal(badRequestCalls, 1)
    assert.equal(noContentCalls, 0)
    assert.deepEqual(payload, {
      uid: 'user-3',
      channel: 'alerts',
      context: ctx,
    })
  })

  test('unsubscribe should return noContent when unsubscribe succeeds', async ({ assert }) => {
    const { default: transmit } = await import('../services/transmit.js')
    const originalUnsubscribe = transmit.unsubscribe

    let payload: any
    transmit.unsubscribe = (async (options: any) => {
      payload = options
      return true
    }) as any

    getActiveTest()?.cleanup(() => {
      transmit.unsubscribe = originalUnsubscribe
    })

    const { default: UnsubscribeController } =
      await import('../src/controllers/unsubscribe_controller.js')
    const controller = new UnsubscribeController()

    let badRequestCalls = 0
    let noContentCalls = 0
    const ctx = {
      request: {
        input: (key: string) => (key === 'uid' ? 'user-4' : 'alerts'),
      },
      response: {
        badRequest: () => {
          badRequestCalls++
          return 'bad-request'
        },
        noContent: () => {
          noContentCalls++
          return 'no-content'
        },
      },
    }

    const result = await controller.handle(ctx as any)

    assert.equal(result, 'no-content')
    assert.equal(badRequestCalls, 0)
    assert.equal(noContentCalls, 1)
    assert.deepEqual(payload, {
      uid: 'user-4',
      channel: 'alerts',
      context: ctx,
    })
  })
})
