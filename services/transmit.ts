/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import { Transmit } from '../src/transmit.js'

let transmit: Transmit

await app.booted(async () => {
  transmit = await app.container.make('transmit')
})

export { transmit as default }
