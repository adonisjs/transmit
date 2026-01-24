/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Configure', (group) => {
  group.tap((t) => t.timeout(10_000))

  group.each.setup(async ({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)

    await context.fs.create('.env', '')
    await context.fs.createJson('tsconfig.json', {})
    await context.fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await context.fs.create('adonisrc.ts', `export default defineConfig({})`)
  })

  test('should register provider', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
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

    const ace = await app.container.make('ace')
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileExists('adonisrc.ts')
    await assert.fileContains('adonisrc.ts', '@adonisjs/transmit/transmit_provider')
  })

  test('should create configuration file', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
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

    const ace = await app.container.make('ace')
    ace.ui.switchMode('raw')

    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    await assert.fileExists('config/transmit.ts')
    await assert.fileContains('config/transmit.ts', 'defineConfig')
  })
})
