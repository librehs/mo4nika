import { Bot, InlineKeyboard } from 'grammy'
import { program } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { Config } from './types'
import Log from '@m4/commons/src/logger'

const L = Log('daemon')

program.option('-c, --config <config_path>')

async function startBot(bot: Bot, config: Config) {
  await bot.init()

  const { chatId, channelId } = config
  const me = await bot.botInfo

  L.i(`Watching chatId=${chatId}`)
  L.i(`Targeting channelId=${channelId}`)

  const chatInfo = await bot.api.getChat(chatId)
  switch (chatInfo.type) {
    case 'group':
    case 'supergroup': {
      L.d(`Chat found: ${chatInfo.title}`)
      if (!chatInfo.permissions?.can_send_messages) {
        L.e('Cannot send messages, exiting')
        process.exit(1)
      }
      break
    }
    default: {
      L.e(`Invalid chat type: ${chatInfo.type}`)
      process.exit(1)
    }
  }

  const channelInfo = await bot.api.getChat(channelId)
  switch (channelInfo.type) {
    case 'channel': {
      L.d(`Channel found: ${channelInfo.title}`)
      break
    }
    default: {
      L.e(`Invalid channel type: ${channelInfo.type}`)
      process.exit(1)
    }
  }

  // Command binding

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

  bot.start()
}

async function main() {
  program.parse()
  const options = program.opts()
  if (!existsSync(options.config)) {
    L.cr()(`File not found: ${options.config}`)
    process.exit(1)
  }
  const configJson = readFileSync(options.config, 'utf-8')
  const config: Partial<Config> = JSON.parse(configJson)
  if (!config.botToken) {
    L.cr()('Bot token not exist in config.botToken')
    process.exit(1)
  }
  if (!config.chatId) {
    L.cr()('Chat ID does not exist in config.chatId')
    process.exit(1)
  }
  if (!config.channelId) {
    L.cr()('Channel ID does not exist in config.channelId')
    process.exit(1)
  }
  const bot = new Bot(config.botToken)

  bot.catch((e) => {
    L.e('[Bot]', e.error)
  })

  await startBot(bot, config as Config)
}

main()
