import { Bot } from 'grammy'
import type { Config } from '../types'

import Log from '@m4/commons/src/logger'
import { parseMessage } from '@m4/commons/src/parser'
const L = Log('save')

export default async function configureBot(bot: Bot, config: Config) {
  L.d('Configured.')

  const { channelId } = config._
  const save = config.feature!.save!

  if (save.db !== 'mongodb') {
    L.cr(1)('Invalid db, quiting')
  }
  const { MongoClient } = await import('mongodb')

  bot.on('channel_post', async (ctx) => {
    let msg = ctx.channelPost
    if (!msg) return
    if (msg.sender_chat?.id !== channelId) return

    const parsedMsg = parseMessage(msg)
    const client = new MongoClient(save.url)
    await client.connect()
    const coll = client.db().collection('posts')
    await coll.insertOne(parsedMsg)
    await client.close()

    L.d(`Saved #${msg.message_id}`)
  })
  bot.on('edited_channel_post', async (ctx) => {
    let msg = ctx.editedChannelPost
    if (!msg) return
    if (msg.sender_chat?.id !== channelId) return

    const parsedMsg = parseMessage(msg)
    const client = new MongoClient(save.url)
    await client.connect()
    const coll = client.db().collection('posts')
    await coll.updateOne(
      { id: parsedMsg.id },
      {
        $set: parsedMsg,
      },
      { upsert: true }
    )
    await client.close()

    L.d(`Edited #${msg.message_id}`)
  })
}
