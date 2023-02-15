import type { Message } from 'grammy/out/types'
import type {
  MessageEntityType,
  PostMessage,
  PostMsgGallery,
  PostMsgPhoto,
} from './types'
import parseTextEntities from './textEntities'

type ParseConfig = {
  disabledTypes: MessageEntityType[]
}

export function parseMessage(
  m: Message,
  _config: Partial<ParseConfig>
): PostMessage {
  const config: ParseConfig = Object.assign(
    {},
    {
      disabledTypes: [],
    },
    _config
  )
  const base: Pick<PostMessage, 'id' | 'date' | 'tags'> & Partial<PostMessage> =
    {
      id: m.message_id,
      date: new Date(m.date * 1000),
      tags: [],
    }

  // ------ Modifiers ------

  // Edited
  if (m.edit_date) {
    base.editDate = new Date(m.edit_date * 1000)
  }

  // Forwarded
  if (m.forward_from_message_id) {
    // 1. From a channel
    base.forwarded = {
      as: 'channel',
      msgId: m.forward_from_message_id,
      channel: m.forward_from_chat!,
      sig: m.forward_signature,
    }
  } else if (m.forward_from_chat && !m.forward_from_message_id) {
    // 2. From an anon (as a chanenl)
    base.forwarded = {
      as: 'anon',
      channel: m.forward_from_chat,
      sig: m.forward_signature,
    }
  } else if (m.forward_from) {
    // 3. From a linked user
    base.forwarded = {
      as: 'user',
      user: m.forward_from,
    }
  } else if (m.forward_sender_name) {
    // 4. From an unlinked user
    base.forwarded = {
      as: 'anonuser',
      name: m.forward_sender_name,
    }
  }

  // Reply to
  if (m.reply_to_message) {
    base.replyTo = m.reply_to_message.message_id
  }

  // Signature
  if (m.author_signature) {
    base.sig = m.author_signature
  }

  // ----- Type ------

  // Text-only
  if (m.text) {
    const { md, tags, headers } = parseTextEntities(
      m.text,
      m.entities ?? [],
      config.disabledTypes
    )
    return {
      ...base,
      type: 'text',
      text: md,
      tags,
      headers,
    }
  }

  // Photo & Gallary
  if (m.photo) {
    const { md, tags, headers } = parseTextEntities(
      m.caption ?? '',
      m.caption_entities ?? [],
      config.disabledTypes
    )
    let ret: PostMsgPhoto | PostMsgGallery = {
      ...base,
      type: 'photo',
      photo: {
        photo: m.photo,
        caption: md,
      },
      headers,
      tags,
    }
    if (m.media_group_id) {
      // it's a gallery
      ret = {
        ...ret,
        type: 'gallery',
        mediaGroupId: m.media_group_id,
      }
    }
    return ret
  }

  // Audio
  if (m.audio) {
    return {
      ...base,
      type: 'audio',
      audio: m.audio,
    }
  }

  // Document
  if (m.document) {
    return {
      ...base,
      type: 'document',
      document: m.document,
    }
  }

  // Video
  if (m.video) {
    return {
      ...base,
      type: 'video',
      video: m.video,
    }
  }

  return {
    ...base,
    type: 'unknown',
    raw: m,
  }
}
