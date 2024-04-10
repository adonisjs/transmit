/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { getActiveTest } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'
import { defineConfig } from '../index.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

export async function setupApp(
  config: {
    transmit?: ReturnType<typeof defineConfig>
  } = {}
) {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .merge({
      config: {
        transmit: config.transmit,
      },
      rcFileContents: {
        providers: [() => import('../providers/transmit_provider.js')],
      },
    })
    .create(BASE_URL, {
      importer: (filePath) => {
        if (filePath.startsWith('./') || filePath.startsWith('../')) {
          return import(new URL(filePath, BASE_URL).href)
        }

        return import(filePath)
      },
    })

  const app = ignitor.createApp('web')
  await app.init().then(() => app.boot())

  getActiveTest()?.cleanup(() => app.terminate())

  return app
}
