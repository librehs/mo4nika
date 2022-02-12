import type { Message } from 'grammy/out/platform.node'
import type { PostMessage, PostMsgGallery, PostMsgPhoto } from './types'
import parseTextEntities from './textEntities'

export function parseMessage(m: Message): PostMessage {
  const base = {
    id: m.message_id,
    date: new Date(m.date * 1000),
    tags: [],
  }
  if (m.edit_date) {
    // @ts-expect-error
    base.editDate = new Date(m.edit_date * 1000)
  }

  if (m.text) {
    const { md, tags } = parseTextEntities(m.text, m.entities ?? [])
    return {
      ...base,
      type: 'text',
      text: md,
      tags,
    }
  }
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
