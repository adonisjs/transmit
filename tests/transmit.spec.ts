/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { memory } from '@rlanz/bus/drivers/memory'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import { Transmit } from '../src/transmit.js'
import { TransportMessageType } from '../src/transport_message_type.js'

const testingUuid = randomUUID()
const testingUuid2 = randomUUID()

test.group('Transmit', () => {
  test('should throw an error if uid is missing', () => {
    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    transmit.$createStream(ctx)
  }).throws('Missing required field "uid" in the request body')

  test('should remove the client when response end', async ({ assert }) => {
    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    assert.equal(transmit.getClients().length, 1)

    ctx.response.response.end()

    assert.equal(transmit.getClients().length, 0)
  }).skip(true, 'Not sure how to end the response')

  test('should emit connect event when a new client connects', async ({ assert }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    transmit.on('connect', () => {
      assert.isTrue(true)
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)
  })

  test('should emit disconnect event when a client disconnects', async ({ assert }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    transmit.on('disconnect', () => {
      assert.isTrue(true)
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    ctx.response.response.end()
  }).skip(true, 'Not sure how to end the response')

  test('should emit subscribe event when a client subscribes to a channel', async ({ assert }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    transmit.on('subscribe', () => {
      assert.isTrue(true)
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
  })

  test('should emit unsubscribe event when a client unsubscribes from a channel', async ({
    assert,
  }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    transmit.on('unsubscribe', () => {
      assert.isTrue(true)
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    transmit.$unsubscribeFromChannel(testingUuid, 'channel1', ctx)
  })

  test('should emit a broadcast event when a message is broadcasted', async ({ assert }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    transmit.on('broadcast', () => {
      assert.isTrue(true)
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    transmit.broadcast('channel1', { message: 'hello' })
  })

  test('should retrieve all subscriptions for a given client', async ({ assert }) => {
    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    await transmit.$subscribeToChannel(testingUuid, 'channel2', ctx)
    await transmit.$subscribeToChannel(testingUuid2, 'channel3', ctx)

    assert.deepEqual(transmit.getSubscriptionsForClient(testingUuid), ['channel1', 'channel2'])
  })

  test('should authorize a channel', async ({ assert }) => {
    assert.plan(2)

    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    transmit.authorizeChannel('channel1', () => {
      assert.isTrue(true)
      return true
    })

    assert.isTrue(await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx))
  })

  test('should not authorize a channel', async ({ assert }) => {
    assert.plan(2)

    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    transmit.authorizeChannel('channel1', () => {
      assert.isTrue(true)
      return false
    })

    assert.isFalse(await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx))
  })

  test('should broadcast a message to all listening clients', async ({ assert }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    const stream = transmit.$createStream(ctx)

    const ctx2 = new HttpContextFactory().create()
    ctx2.request.setInitialBody({ uid: testingUuid2 })
    const stream2 = transmit.$createStream(ctx2)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)

    let dataReceived = false
    stream.on('data', (message) => {
      //? Ignore the first message
      if (message === '\n') return

      dataReceived = true
    })

    stream2.on('data', () => {
      assert.fail('Should not receive the broadcasted message')
    })

    transmit.broadcast('channel1', { message: 'hello' })

    assert.isTrue(dataReceived)
  })

  test('should broadcast a message to all listening clients except the sender', async ({
    assert,
  }) => {
    assert.plan(1)

    const transmit = new Transmit({
      transport: null,
    })

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    const stream = transmit.$createStream(ctx)

    const ctx2 = new HttpContextFactory().create()
    ctx2.request.setInitialBody({ uid: testingUuid2 })
    const stream2 = transmit.$createStream(ctx2)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    await transmit.$subscribeToChannel(testingUuid2, 'channel1', ctx)

    let dataReceived = false
    stream.on('data', (message) => {
      //? Ignore the first message
      if (message === '\n') return

      dataReceived = true
    })

    stream2.on('data', () => {
      assert.fail('Should not receive the broadcasted message')
    })

    transmit.broadcastExcept('channel1', { message: 'hello' }, testingUuid2)

    assert.isTrue(dataReceived)
  })

  test('should not broadcast to ourself when sending to the bus', async ({ assert }) => {
    const transport = memory()()

    const transmit = new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)

    transmit.broadcast('channel1', { message: 'hello' })

    assert.lengthOf(transport.receivedMessages, 0)
  })

  test('should broadcast to the bus when a client subscribe to a channel', async ({ assert }) => {
    const transport = memory()()

    const transmit = new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)

    assert.lengthOf(transport.receivedMessages, 1)
    assert.equal(transport.receivedMessages[0].type, TransportMessageType.Subscribe)
  })

  test('should broadcast to the bus when a client unsubscribe a channel', async ({ assert }) => {
    const transport = memory()()

    const transmit = new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    transmit.$unsubscribeFromChannel(testingUuid, 'channel1', ctx)

    assert.lengthOf(transport.receivedMessages, 2)
    assert.equal(transport.receivedMessages[1].type, TransportMessageType.Unsubscribe)
  })

  test('should broadcast to the bus when sending a message', async ({ assert }) => {
    const transport = memory()()

    const transmit = new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    transmit.broadcast('channel1', { message: 'hello' })

    assert.lengthOf(transport.receivedMessages, 2)
    assert.equal(transport.receivedMessages[1].type, TransportMessageType.Broadcast)
  })

  test('second instance should receive the broadcasted message', async ({ assert }) => {
    const transport = memory()()

    const transmit = new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      memory()()
    )

    const transmit2 = new Transmit(
      {
        transport: {
          driver: memory(),
        },
      },
      transport
    )

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    transmit.$createStream(ctx)

    const ctx2 = new HttpContextFactory().create()
    ctx2.request.setInitialBody({ uid: testingUuid2 })
    const stream = transmit2.$createStream(ctx2)

    await transmit.$subscribeToChannel(testingUuid, 'channel1', ctx)
    await transmit2.$subscribeToChannel(testingUuid2, 'channel1', ctx2)

    let dataReceived = false
    stream.on('data', () => {
      dataReceived = true
    })

    transmit.broadcast('channel1', { message: 'hello' })

    assert.isTrue(dataReceived)
  })

  test('should ping all subscribers', async ({ assert, cleanup }, done) => {
    const transmit = new Transmit({
      transport: null,
      pingInterval: 100,
    })
    cleanup(() => transmit.shutdown())

    const ctx = new HttpContextFactory().create()
    ctx.request.setInitialBody({ uid: testingUuid })
    const stream = transmit.$createStream(ctx)

    stream.on('data', (message) => {
      //? Ignore the first message
      if (message === '\n') return

      assert.include(message, '$$transmit/ping')
      done()
    })
  }).waitForDone()
})
