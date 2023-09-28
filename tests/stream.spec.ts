import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { Stream } from '../src/stream.js'
import { Sink } from '../test-helpers/sink.js'

test.group('Stream', () => {
  test('should write multiple chunks to the stream', async ({ assert }) => {
    const stream = new Stream(randomUUID())
    const sink = new Sink()
    stream.pipe(sink)

    stream.writeMessage({ data: { channel: 'foo', payload: 'bar' } })
    stream.writeMessage({ data: { channel: 'baz', payload: 'qux' } })

    assert.equal(
      sink.content,
      [
        `:ok\n\n`,
        `data: {"channel":"foo","payload":"bar"}\n\n`,
        `data: {"channel":"baz","payload":"qux"}\n\n`,
      ].join('')
    )
  })

  test('sets headers on the response', async ({ assert }) => {
    assert.plan(2)

    const stream = new Stream(randomUUID())
    const sink = new Sink()

    sink.assertWriteHead((statusCode, headers) => {
      assert.equal(statusCode, 200)
      assert.deepEqual(headers, {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Expire': '0',
        'Pragma': 'no-cache',
        'X-Accel-Buffering': 'no',
      })
    })

    stream.pipe(sink)
  })
})
