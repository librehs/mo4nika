import { program } from 'commander'
import { MongoClient } from 'mongodb'
import { existsSync, readFileSync } from 'fs'

import { POSTS_COLLECTION } from '@m4/commons/src/constants'
import Log from '@m4/commons/src/logger'
import type { PostMessage } from '@m4/commons/src/types'

const L = Log('importer')

program.option('-d, --database <database_uri>').option('-f, --file <dump_file>')

async function main() {
  program.parse()
  const options = program.opts()
  if (!existsSync(options.file)) {
    L.cr()(`File not found: ${options.file}`)
    process.exit(1)
  }
  const dumpJson = readFileSync(options.file, 'utf-8')
  const dump = JSON.parse(dumpJson)

  L.i(`Channel name: ${dump.name}`)
  L.i(`Channel ID: ${dump.id}`)

  const finalItems: PostMessage[] = dump.messages
  L.i(`Converted ${finalItems.length}/${dump.messages.length} item(s).`)

  L.i('Connecting to MongoDB...')
  const client = new MongoClient(options.database)
  await client.connect()
  const $posts = client.db().collection<PostMessage>(POSTS_COLLECTION)
  L.i('Writing data...')
  await $posts.insertMany(finalItems, {
    ordered: false,
  })
  L.i('Import completed.')
  await client.close()
}

main()
