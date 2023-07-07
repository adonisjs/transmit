import app from '@adonisjs/core/services/app'
import { Transmit } from '../src/transmit.js'

let transmit: Transmit

await app.booted(async () => {
  transmit = await app.container.make('transmit')
})

export { transmit as default }
