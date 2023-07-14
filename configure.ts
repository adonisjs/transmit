import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  /**
   * Add the provider to the RC file
   */
  await command.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/transmit/providers/transmit_provider')
  })
}
