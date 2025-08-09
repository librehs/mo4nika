import { Bot } from 'grammy'
import type { Config, MediaGroup, RawMessage } from '../types'

import Log from '@m4/commons/src/logger'
import {
  POSTS_COLLECTION,
  MEDIA_GROUPS_COLLECTION,
} from '@m4/commons/src/constants'
import type { Message } from 'grammy/out/types'
const L = Log('save')

export default async function configureBot(bot: Bot, config: Config) {
  L.d('Configured.')

  const { channelId } = config._
  const save = config.feature!.save!

  if (save.db !== 'mongodb') {
    L.cr(1)('Invalid db, quiting')
  }
  const { MongoClient } = await import('mongodb')

  const saveMessage = async (msg: Message, newMsg: boolean) => {
    const client = new MongoClient(save.url)
    await client.connect()
    const rawMsg: RawMessage = {
      type: 'raw',
      message: msg,
    }
    const $posts = client.db().collection<RawMessage>(POSTS_COLLECTION)
    await $posts.updateOne(
      { id: msg.message_id },
      {
        $set: rawMsg,
      },
      { upsert: true }
    )
    if (msg.media_group_id) {
      const mediaGroupId = msg.media_group_id
      const $mediaGroups = client
        .db()
        .collection<MediaGroup>(MEDIA_GROUPS_COLLECTION)
      if (newMsg) {
        await $mediaGroups.updateOne(
          { mediaGroupId },
          {
            $push: {
              items: rawMsg,
            },
          },
          { upsert: true }
        )
      } else {
        await $mediaGroups.updateOne(
          { mediaGroupId },
          {
            $set: {
              'items.$[elem]': rawMsg,
            },
          },
          {
            arrayFilters: [
              {
                'elem.id': {
                  $eq: msg.message_id,
                },
              },
            ],
            upsert: true,
          }
        )
      }
    }
    await client.close()
  }

  bot.on('channel_post', async (ctx) => {
    let msg = ctx.channelPost
    if (!msg) return
    L.d(msg)
    if (msg.sender_chat?.id !== channelId) return
    await saveMessage(msg, true)
    L.d(`Saved #${msg.message_id}`)
  })
  bot.on('edited_channel_post', async (ctx) => {
    let msg = ctx.editedChannelPost
    if (!msg) return
    L.d(msg)
    if (msg.sender_chat?.id !== channelId) return
    await saveMessage(msg, false)
    L.d(`Edited #${msg.message_id}`)
  })
}
