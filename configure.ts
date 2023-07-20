/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  // Publish config file
  await command.publishStub('config.stub')

  // Add provider to rc file
  await command.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/transmit/transmit_provider')
  })
}
