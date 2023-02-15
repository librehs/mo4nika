import { Bot } from 'grammy'
import { program } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { Config } from './types'
import Log from '@m4/commons/src/logger'
import setPublish from './handler/publish'
import setSave from './handler/save'
import { parseChatId } from './utils'

const L = Log('daemon')

program.option('-c, --config <config_path>')

async function startBot(bot: Bot, config: Config) {
  await bot.init()
  const { chatId, channelId } = config._
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
  config.channelId = parseChatId(config.channelId ?? '')
  config.chatId = parseChatId(config.chatId ?? '')
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
  config._ = {
    channelId: Number(config.channelId),
    chatId: Number(config.chatId),
  }
  const bot = new Bot(config.botToken)

  bot.catch((e) => {
    L.e('[Bot]', e.error)
  })

  const _conf = config as Config

  await startBot(bot, _conf)
  const feature = config.feature ?? {}
  if (feature.publish && feature.publish.enabled) {
    await setPublish(bot, _conf)
  }
  if (feature.save) {
    await setSave(bot, _conf)
  }

  bot.start()
}

main()
