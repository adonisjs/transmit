/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Transmit } from '@boringnode/transmit'
import type { Route } from '@adonisjs/core/http'
import type { TransmitConfig } from '@boringnode/transmit/types'
import type { HttpRouterService } from '@adonisjs/core/types'
import type { Transport } from '@boringnode/bus/types/main'

const EventStreamController = () => import('./controllers/event_stream_controller.js')
const SubscribeController = () => import('./controllers/subscribe_controller.js')
const UnsubscribeController = () => import('./controllers/unsubscribe_controller.js')

export class TransmitAdonisAdapter extends Transmit {
  #router: HttpRouterService

  constructor(config: TransmitConfig, router: HttpRouterService, transport?: Transport | null) {
    super(config, transport)

    this.#router = router
  }

  registerRoutes(routeHandlerModifier?: (route: Route) => void) {
    const eventStreamRoute = this.#router.get('__transmit/events', [EventStreamController])
    const subscribeRoute = this.#router.post('__transmit/subscribe', [SubscribeController])
    const unsubscribeRoute = this.#router.post('__transmit/unsubscribe', [UnsubscribeController])

    if (routeHandlerModifier) {
      routeHandlerModifier(eventStreamRoute)
      routeHandlerModifier(subscribeRoute)
      routeHandlerModifier(unsubscribeRoute)
    }
  }
}
