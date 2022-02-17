import type { DbConfig, MisskeyConfig } from '../../types'
import type { PostMessage, MediaGroup } from '@m4/commons/src/types'
import {
  POSTS_COLECTION,
  MEDIA_GROUPS_COLLECTION,
  SENDER_PREFIX,
} from '@m4/commons/src/constants'
import MisskeyApi from './misskeyApi'
import Log from '@m4/commons/src/logger'

const L = Log('misskey')

type RuntimeConfig = {
  key: 0
  lastMessageId: number
}

const SENDER_KEY: Partial<RuntimeConfig> = { key: 0 }

async function sendMessageToMisskey(api: MisskeyApi, msg: PostMessage) {
  // TODO
}

async function update(conf: MisskeyConfig, db: DbConfig) {
  if (db.db !== 'mongodb') {
    L.cr()(`Invalid db type: ${db.db}`)
  }

  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(db.url)
  await client.connect()

  const api = new MisskeyApi(conf.domain, conf.token)
  const me = await api.getMe()
  L.i(`Misskey connected: ${me.username}`)

  const $posts = client.db().collection<PostMessage>(POSTS_COLECTION)
  const $mediaGroups = client
    .db()
    .collection<MediaGroup>(MEDIA_GROUPS_COLLECTION)
  const $sender = client.db().collection<RuntimeConfig>(SENDER_PREFIX)

  const fromMessageId = (await $sender.findOne(SENDER_KEY))?.lastMessageId ?? -1

  const bulkMessageLimit = Number(conf.bulkMessageLimit) || 5
  const sendAfterSeconds = Number(conf.sendAfterSeconds) || 30
  const now = new Date()

  const cursor = $posts.find<PostMessage>(
    {
      id: {
        $gt: fromMessageId,
      },
    },
    {
      sort: { id: 1 },
    }
  )

  let lastMessageId = fromMessageId
  let alreadySentMessage = 0
  while (true) {
    if (alreadySentMessage >= bulkMessageLimit) break
    const next = await cursor.next()
    if (!next) break
    if (Number(now) - Number(next.date) <= sendAfterSeconds * 1000) break

    await sendMessageToMisskey(api, next)

    alreadySentMessage++
    lastMessageId = next.id
  }

  await $sender.updateOne(
    SENDER_KEY,
    {
      $set: {
        lastMessageId,
      },
    },
    {}
  )
}

export default update
