import { assert } from '@japa/assert'
import { fileSystem } from '@japa/file-system'
import { processCLIArgs, configure, run } from '@japa/runner'

processCLIArgs(process.argv.slice(2))
configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert(), fileSystem({ autoClean: true })],
})

await run()
