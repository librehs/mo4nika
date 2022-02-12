import type { Message } from 'grammy/out/platform.node'
import type { PostMessage, PostMsgGallery, PostMsgPhoto } from './types'
import parseTextEntities from './textEntities'

export function parseMessage(m: Message): PostMessage {
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

  // ----- Type ------

  // Text-only
  if (m.text) {
    const { md, tags } = parseTextEntities(m.text, m.entities ?? [])
    return {
      ...base,
      type: 'text',
      text: md,
      tags,
    }
  }

  // Photo & Gallary
  if (m.photo) {
    const { md, tags } = parseTextEntities(m.caption!, m.caption_entities ?? [])
    let ret: PostMsgPhoto | PostMsgGallery = {
      ...base,
      type: 'photo',
      photos: [
        {
          photo: m.photo,
          caption: md,
        },
      ],
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

  return {
    ...base,
    type: 'unknown',
    raw: m,
  }
}
