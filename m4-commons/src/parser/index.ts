import type { Message } from 'grammy/out/platform.node'
import parseTextEntities from './textEntities'
import { PostMessage } from './types'

export function parseMessage(m: Message): PostMessage {
  const base = {
    id: m.message_id,
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
