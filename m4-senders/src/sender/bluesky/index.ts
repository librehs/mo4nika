import type { BlueskyConfig, Config, DbConfig } from '../../types'
import type {
  PostMessage,
  MediaGroup,
  BlueskyMessageThreadMeta,
} from '@m4/commons/src/types'
import {
  POSTS_COLLECTION,
  MEDIA_GROUPS_COLLECTION,
  SENDER_PREFIX,
} from '@m4/commons/src/constants'
import { AtpAgent } from '@atproto/api'
import Log from '@m4/commons/src/logger'
import { sendPost } from './sendPost'

const L = Log('bluesky')

type RuntimeConfig = {
  key: 0
  lastMessageId: number
}

const SENDER_KEY: Partial<RuntimeConfig> = { key: 0 }

async function update(conf: BlueskyConfig, glob: Config) {
  const db: DbConfig = glob.db
  if (db.db !== 'mongodb') {
    L.cr()(`Invalid db type: ${db.db}`)
  }

  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(db.url)
  await client.connect()

  const agent = new AtpAgent({
    service: conf.service,
  })
  await agent.login({
    identifier: conf.username,
    password: conf.password,
  })
  L.i(`Bluesky connected: ${conf.username}`)

  const $posts = client.db().collection<PostMessage>(POSTS_COLLECTION)
  const $mediaGroups = client
    .db()
    .collection<MediaGroup>(MEDIA_GROUPS_COLLECTION)
  const $sender = client
    .db()
    .collection<RuntimeConfig>(SENDER_PREFIX + 'bluesky')
  L.i(`Database connected`)

  const fromMessageId = (await $sender.findOne(SENDER_KEY))?.lastMessageId ?? -1
  if (fromMessageId !== -1) L.i(`Last time sent: #${fromMessageId}`)

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
    if (alreadySentMessage >= bulkMessageLimit) {
      L.d('Already sent enough, quitting')
      break
    }
    const next = await cursor.next()
    if (!next) {
      L.d('No next message, quitting')
      break
    }
    if (next.type !== 'raw') {
      L.w(`Message collected by older version of daemon, skipping`)
      lastMessageId = next.message.message_id
      break
    }
    L.d(`Processing message #${next.message.message_id}`)
    if (
      Number(now) - Number(next.message.date * 1000) <=
      sendAfterSeconds * 1000
    ) {
      L.d('Message too young, quitting')
      break
    }

    let postMeta: BlueskyMessageThreadMeta | null
    if (next.message.media_group_id) {
      const msgGroup = await $mediaGroups.findOne({
        mediaGroupId: next.message.media_group_id,
      })
      if (!msgGroup) {
        L.e(`Message group #${next.message.media_group_id} not found, skipping`)
        continue
      }
      const msgs = msgGroup.items
      if (
        msgs.filter(
          (x) =>
            Number(now) - Number(x.message.date * 1000) <=
            sendAfterSeconds * 1000
        ).length > 0
      ) {
        L.d('Some messages in the message group too young, quitting')
        break
      }
      postMeta = await sendPost(agent, msgs, glob, $posts)
    } else {
      postMeta = await sendPost(agent, [next], glob, $posts)
    }
    alreadySentMessage++
    lastMessageId = next.message.message_id

    L.d(`Sent message #${next.message.message_id}`)

    if (postMeta) {
      await $posts.updateOne(
        { id: next.message.message_id },
        {
          $set: {
            bluesky: postMeta,
          },
        }
      )
    }
  }

  L.i(`Messages up to #${lastMessageId} has been sent`)
  await $sender.updateOne(
    SENDER_KEY,
    {
      $set: {
        lastMessageId,
      },
    },
    {
      upsert: true,
    }
  )
  L.i('Operation completed')
  await client.close()
}

export default update
