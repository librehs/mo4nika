import type { Message as TelegramMessage } from 'grammy/out/types'

interface SaveConfig {
  db: 'mongodb'
  url: string
}

interface PublishConfig {
  enabled: boolean
}

interface SpecializedId {
  chatId: number
  channelId: number
}

interface Feature {
  save?: SaveConfig
  publish?: PublishConfig
}

export interface Config {
  botToken: string
  chatId: number
  channelId: number
  feature?: Feature
  _: SpecializedId
}

/**
 * We switched to save the original schema of Telegram message to easily create Bluesky message.
 *
 * In the past we save the parsed MFM (Misskey Formatted Markdown) format.
 */
export interface RawMessage {
  type: 'raw'
  message: TelegramMessage
}

export type MediaGroup = {
  mediaGroupId: string
  items: RawMessage[]
}
