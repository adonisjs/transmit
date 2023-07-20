import type { TransmitConfig } from './types/main.js'

export function defineConfig<T extends TransmitConfig>(config: T): T {
  if (config.transport && typeof config.transport.channel === 'undefined') {
    config.transport.channel = 'transmit::broadcast'
  }

  return config
}
