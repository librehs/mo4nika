import type { MessageEntity } from 'grammy/out/types'

export type MessageEntityType =
  | MessageEntity.CommonMessageEntity['type']
  | MessageEntity.TextLinkMessageEntity['type']
  | MessageEntity.TextMentionMessageEntity['type']
  | MessageEntity.PreMessageEntity['type']
  | MessageEntity.CustomEmojiMessageEntity['type']
