import { Bot, webhookCallback } from 'grammy'
import { Router } from 'worktop'
import { listen } from 'worktop/cache'
import configureBot from '@m4/daemon/src/configure'
import Log from '@m4/commons/src/logger'

const L = Log('worker')

const bot = new Bot(BOT_TOKEN)
configureBot(bot, {
  botToken: BOT_TOKEN,
  channelId: CHANNEL_ID,
  chatId: CHAT_ID,
})
bot.catch((e) => {
  L.e('[Bot]', e.error)
})

const API = new Router()
API.add('POST', WEBHOOK_PATH, webhookCallback(bot, 'worktop'))
API.add('POST', /.*/, (req, res) => {
  res.status = 200
  res.body = 'Path not found, but let it go'
})
listen(API.run)
