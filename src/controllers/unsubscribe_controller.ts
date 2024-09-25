/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import transmit from '../../services/transmit.js'
import type { HttpContext } from '@adonisjs/core/http'

export default class UnsubscribeController {
  async handle(ctx: HttpContext) {
    const uid = ctx.request.input('uid')
    const channel = ctx.request.input('channel')

    const success = await transmit.unsubscribe({
      uid,
      channel,
      context: ctx,
    })

    if (!success) {
      return ctx.response.badRequest()
    }

    return ctx.response.noContent()
  }
}
