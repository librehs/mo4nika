import Log from '@m4/commons/src/logger'
import { parseTextSegment } from '@m4/commons/src/parser/textEntities'
import { PostMessage, PostMsgText } from '@m4/commons/src/types'

const L = Log('importer')

export default function parse(m: any): PostMessage | null {
  const Lw = (...args: any) => L.w(`#${m.id}:`, ...args)

  if (m.type === 'service') {
    Lw('Service message, skipping')
    return null
  }
  if (m.media_type) {
    switch (m.media_type) {
      case 'animation':
      case 'sticker':
      case 'video_file':
      case 'audio_file': {
        Lw('Rich media message, skipping')
        return null
      }
    }
  }
  if (m.poll) {
    Lw('Poll message, skipping')
    return null
  }
  if (m.file) {
    Lw('File message, skipping')
    return null
  }
  if (m.photo) {
    Lw('Photo message, skipping')
    return null
  }

  const { text, tags } = parseText(m.text)

  // Only plain-text message
  let result: PostMsgText = {
    isImported: true,
    type: 'text',
    text,
    id: m.id,
    date: new Date(m.date),
    tags,
  }

  if (m.forwarded_from) {
    result = {
      ...result,
      forwarded: {
        as: 'anonuser',
        name: m.forwarded_from,
      },
    }
  }

  if (m.edited) {
    result = {
      ...result,
      editDate: new Date(m.edited),
    }
  }
  if (m.reply_to_message_id) {
    result = {
      ...result,
      replyTo: m.reply_to_message_id,
    }
  }
  if (m.author) {
    result = {
      ...result,
      sig: m.author,
    }
  }

  return result
}

function parseText(raw: string | any[]): {
  text: string
  tags: string[]
} {
  if (typeof raw === 'string') return { text: raw, tags: [] }
  let text = ''
  let tags: string[] = []
  for (const part of raw) {
    if (typeof part === 'string') {
      text += part
      continue
    }

    const { text: _text, tags: _tags } = parseTextSegment(
      part.text,
      part.type,
      part.user_id,
      part.href
    )

    tags = tags.concat(_tags)
    text += _text
  }
  return {
    text,
    tags,
  }
}
