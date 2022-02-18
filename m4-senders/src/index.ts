import { program } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { Config } from './types'
import Log from '@m4/commons/src/logger'

import misskeyUpdate from './sender/misskey'

const L = Log('daemon')

program.option('-c, --config <config_path>')

async function main() {
  program.parse()
  const options = program.opts()
  if (!existsSync(options.config)) {
    L.cr()(`File not found: ${options.config}`)
    process.exit(1)
  }
  const configJson = readFileSync(options.config, 'utf-8')
  const config: Partial<Config> = JSON.parse(configJson)

  if (!config.db) {
    L.cr()('Database config not found, quiting')
    process.exit(1)
  }
  if (!config.channel) {
    L.cr()('Channel config not found, quiting')
    process.exit(1)
  }

  if (config?.misskey?.enabled) {
    await misskeyUpdate(config.misskey, config as Config)
  }
}

main()
