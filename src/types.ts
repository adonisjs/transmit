import type { Transmit } from './transmit.js'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    transmit: Transmit
  }
}
