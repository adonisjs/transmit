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
import { Stream } from '../src/stream.js'
import { StreamChannelRepository } from '../src/stream_channel_repository.js'

test.group('StreamChannelRepository', () => {
  test('should push a stream inside the repository', async ({ assert }) => {
    const stream1 = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream1)

    assert.equal(repository.getChannelCount(), 1)

    const stream2 = new Stream(randomUUID())
    repository.push(stream2)

    assert.equal(repository.getChannelCount(), 2)
  })

  test('should remove a stream from the repository', async ({ assert }) => {
    const stream = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream)

    assert.equal(repository.getChannelCount(), 1)

    repository.remove(stream)

    assert.equal(repository.getChannelCount(), 0)
  })

  test('should add channel to the stream', async ({ assert }) => {
    const stream = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream)

    assert.isTrue(repository.addChannelToStream(stream.getUid(), 'foo'))
    assert.isTrue(repository.addChannelToStream(stream.getUid(), 'bar'))
    assert.isFalse(repository.addChannelToStream(randomUUID(), 'baz'))
  })

  test('should remove channel from the stream', async ({ assert }) => {
    const stream = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream)

    repository.addChannelToStream(stream.getUid(), 'foo')
    repository.addChannelToStream(stream.getUid(), 'bar')

    assert.isTrue(repository.removeChannelFromStream(stream.getUid(), 'foo'))
    assert.isFalse(repository.removeChannelFromStream(randomUUID(), 'baz'))
  })

  test('should find subscribers for a given channel', async ({ assert }) => {
    const stream1 = new Stream(randomUUID())
    const stream2 = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream1)
    repository.push(stream2)

    repository.addChannelToStream(stream1.getUid(), 'foo')
    repository.addChannelToStream(stream2.getUid(), 'foo')
    repository.addChannelToStream(stream2.getUid(), 'bar')

    const subscribers = repository.findByChannel('foo')
    assert.equal(subscribers.size, 2)
  })

  test('should get channels for a given client', async ({ assert }) => {
    const stream = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream)

    repository.addChannelToStream(stream.getUid(), 'foo')
    repository.addChannelToStream(stream.getUid(), 'bar')

    const channels = repository.getChannelByClient(stream.getUid())

    assert.isDefined(channels)
    assert.isTrue(channels!.has('foo'))
    assert.isTrue(channels!.has('bar'))
  })

  test('should get all subscribers', async ({ assert }) => {
    const stream1 = new Stream(randomUUID())
    const stream2 = new Stream(randomUUID())
    const repository = new StreamChannelRepository()

    repository.push(stream1)
    repository.push(stream2)

    repository.addChannelToStream(stream1.getUid(), 'foo')
    repository.addChannelToStream(stream2.getUid(), 'bar')

    const subscribers = repository.getAllSubscribers()

    assert.equal(subscribers.size, 2)
  })
})
