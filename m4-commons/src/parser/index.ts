import type { Message } from 'grammy/out/platform.node'
import type { PostMessage } from './types'
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
    return {
      ...base,
      type: 'gallary',
      mediaGroupId: m.media_group_id!,
      photos: [
        {
          photo: m.photo,
          caption: md,
        },
      ],
      tags,
    }
  }

  return {
    ...base,
    type: 'unknown',
    raw: m,
  }
}
