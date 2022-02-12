import { Bot } from 'grammy'
import type { Config } from '../types'

import Log from '@m4/commons/src/logger'
import { parseMessage } from '@m4/commons/src/parser'
import type { Message } from 'grammy/out/platform.node'
const L = Log('save')

const POSTS_COLECTION = 'posts'
const MEDIA_GROUPS_COLLECTION = 'mediagroups'

export default async function configureBot(bot: Bot, config: Config) {
  L.d('Configured.')

  const { channelId } = config._
  const save = config.feature!.save!

  if (save.db !== 'mongodb') {
    L.cr(1)('Invalid db, quiting')
  }
  const { MongoClient } = await import('mongodb')

  const saveMessage = async (msg: Message, newMsg: boolean) => {
    const parsedMsg = parseMessage(msg)
    const client = new MongoClient(save.url)
    await client.connect()
    const $posts = client.db().collection(POSTS_COLECTION)
    await $posts.updateOne(
      { id: parsedMsg.id },
      {
        $set: parsedMsg,
      },
      { upsert: true }
    )
    if (parsedMsg.type === 'gallery') {
      const mediaGroupId = parsedMsg.mediaGroupId
      const $mediaGroups = client.db().collection(MEDIA_GROUPS_COLLECTION)
      if (newMsg) {
        await $mediaGroups.updateOne(
          { mediaGroupId },
          {
            $push: {
              items: parsedMsg,
            },
          },
          { upsert: true }
        )
      } else {
        await $mediaGroups.updateOne(
          { mediaGroupId },
          {
            $set: {
              'items.$[elem]': parsedMsg,
            },
          },
          {
            arrayFilters: [
              {
                'elem.id': {
                  $eq: parsedMsg.id,
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
    if (msg.sender_chat?.id !== channelId) return
    await saveMessage(msg, true)
    L.d(`Saved #${msg.message_id}`)
  })
  bot.on('edited_channel_post', async (ctx) => {
    let msg = ctx.editedChannelPost
    if (!msg) return
    if (msg.sender_chat?.id !== channelId) return
    await saveMessage(msg, false)
    L.d(`Edited #${msg.message_id}`)
  })
}
