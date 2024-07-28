/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RuntimeException } from '@poppinss/utils'
import transmit from '../../services/transmit.js'
import type { HttpContext } from '@adonisjs/core/http'

export default class EventStreamController {
  handle(ctx: HttpContext) {
    const uid = ctx.request.input('uid')

    if (!uid) {
      throw new RuntimeException('Missing required field "uid" in the request body')
    }

    const stream = transmit.createStream({
      uid,
      context: ctx,
      request: ctx.request.request,
      response: ctx.response.response,
    })

    return ctx.response.stream(stream)
  }
}
