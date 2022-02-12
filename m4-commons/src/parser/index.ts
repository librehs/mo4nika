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
  if (m.forward_from) {
    // from user
    base.forwarded = {
      as: 'user',
      user: m.forward_from,
    }
  }
  if (m.forward_from_message_id) {
    // from channel
    base.forwarded = {
      as: 'channel',
      channel: m.forward_from_chat!,
      id: m.forward_from_message_id,
    }
  }
  if (m.forward_from_chat && !m.forward_from_message_id) {
    // from anon
    base.forwarded = {
      as: 'anon',
      channel: m.forward_from_chat,
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
