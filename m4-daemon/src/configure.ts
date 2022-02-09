import { Bot, InlineKeyboard } from 'grammy'
import type { Config } from './types'

import Log from '@m4/commons/src/logger'
const L = Log('daemon')

export default function configureBot(bot: Bot, config: Config) {
  const { chatId, channelId } = config

  bot.command('ping', async (ctx) => {
    const msg = ctx.message
    if (!msg) return
    L.d('Ping', msg)
    ctx.reply(`I'm here!\nChat ID: ${msg.chat.id}`, {
      reply_to_message_id: msg.message_id,
    })
  })

  bot.command('publish', async (ctx) => {
    const msg = ctx.message
    if (!msg) {
      L.w('Message not found for command, skipping')
      return
    }
    const targetMsg = msg.reply_to_message
    if (!targetMsg) {
      L.w(`OP for #${msg.message_id} not found!`)
      ctx.reply(
        'OP not found. Please send the OP again and reply `/publish` to it.',
        {
          reply_to_message_id: msg.message_id,
        }
      )
      return
    }

    const copiedMsg = await ctx.api.copyMessage(
      chatId,
      chatId,
      targetMsg.message_id
    )
    const operationInlineKeyboard = new InlineKeyboard().text(
      'Sure!',
      `p|${copiedMsg.message_id}`
    )
    await ctx.api.sendMessage(chatId, `Send this?`, {
      reply_to_message_id: copiedMsg.message_id,
      reply_markup: operationInlineKeyboard,
    })
  })
  bot.callbackQuery(
    /p|([0-9]+)/, // match the one in operationInlineKeyboard
    async (ctx) => {
      const data = ctx.callbackQuery.data
      if (data.split('|').length !== 2) {
        await ctx.answerCallbackQuery({
          text: '[/publish] Failed to recognize data',
        })
        return
      }
      const msgId = parseInt(data.split('|')[1])
      if (Number.isNaN(msgId)) {
        await ctx.answerCallbackQuery({
          text: '[/publish] Invalid message ID',
        })
        return
      }
      const sender = ctx.callbackQuery.from
      const chatMemberInfo = await ctx.getChatMember(sender.id)
      if (
        chatMemberInfo.status === 'administrator' ||
        chatMemberInfo.status === 'creator'
      ) {
        await ctx.api.copyMessage(channelId, chatId, msgId)
        await ctx.answerCallbackQuery('Done.')
      } else {
        await ctx.answerCallbackQuery('Permission denied.')
      }
    }
  )
}
