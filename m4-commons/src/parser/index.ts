import type { Message } from 'grammy/out/platform.node'
import type { PostMessage, PostMessageMeta } from './types'
import parseTextEntities from './textEntities'

export function parseMessage(m: Message): PostMessage {
  const base = {
    id: m.message_id,
    date: new Date(m.date * 1000),
  }
  if (m.edit_date) {
    // @ts-expect-error
    base.editDate = new Date(m.edit_date * 1000)
  }

  if (m.text) {
    return {
      ...base,
      type: 'text',
      text: parseTextEntities(m.text, m.entities ?? []),
    }
  }
  if (m.photo) {
    return {
      ...base,
      type: 'gallary',
      mediaGroupId: m.media_group_id!,
      photos: [
        {
          photo: m.photo,
          caption: parseTextEntities(m.caption!, m.caption_entities ?? []),
        },
      ],
    }
  }

  return {
    ...base,
    type: 'unknown',
    raw: m,
  }
}
