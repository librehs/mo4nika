import type { Chat, User, Message as TelegramMessage } from 'grammy/out/types'

interface RemoteImage {
  type: 'remote'
  url: string
}

interface TelegramImage {
  type: 'telegram'
  file_id: string
}

type Image = RemoteImage | TelegramImage

export interface ImageItem {
  /// the image object.
  obj: Image
  /// alternative text. preferable plaintext.
  alt?: string
}

interface TextMessage {
  type: 'text'
  text: string
}

interface ImageMessage {
  type: 'image'
  text: string
  images: ImageItem[]
}

export type Message = TextMessage | ImageMessage

export type Result = ResultSuccess | ResultFailure

export interface ResultSuccess {
  ok: true
  identifer: string
}

export interface ResultFailure {
  ok: false
  error?: Error
}

export interface Sender {
  sendMessage: (m: Message) => Promise<Result>
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

/**
 * We switched to save the original schema of Telegram message to easily create Bluesky message.
 *
 * In the past we save the parsed MFM (Misskey Formatted Markdown) format.
 */
export type MediaGroup = {
  mediaGroupId: string
  items: RawMessage[]
}

export type BlueskyMessageMeta = { uri: string; cid: string }
export type BlueskyMessageThreadMeta = {
  root: BlueskyMessageMeta
  self: BlueskyMessageMeta
}

type PostMessageExternalMeta = {
  misskey: {
    id: string
  }
  bluesky: BlueskyMessageThreadMeta
}

export type PostMessage = RawMessage & Partial<PostMessageExternalMeta>
