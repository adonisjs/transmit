/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { SecureChannelStore } from '../src/secure_channel_store.js'

test.group('SecureChannelStore', () => {
  test('add channel to the store', async ({ assert }) => {
    const store = new SecureChannelStore()

    try {
      store.add('users/:id')
    } catch (error) {
      assert.isTrue(false)
    }
  })

  test('match channel', async ({ assert }) => {
    const store = new SecureChannelStore()
    store.add('users/:id')

    const match = store.match('users/1')
    assert.deepEqual(match, { params: { id: '1' }, url: 'users/:id' })
  })
})
