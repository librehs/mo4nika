import type { PostMessage } from '@m4/commons/src/types'
import type MisskeyApi from './misskeyApi'

import Log from '@m4/commons/src/logger'
const L = Log('misskey')

export default async function sendNote(api: MisskeyApi, msg: PostMessage) {
  if (['unknown', 'document', 'audio', 'video'].includes(msg.type)) {
    L.w(`Unrecognized message type "${msg.type}", skipping`)
    return
  }
  const text = getText(msg)
  switch (msg.type) {
    case 'gallery':
    case 'photo': {
      // TODO
    }
  }

  await api.createNote({
    visibility: 'public',
    text,
  })
}

function getText(msg: PostMessage): string {
  switch (msg.type) {
    case 'text': {
      return msg.text
    }
    case 'photo': {
      return msg.photos[0].caption!
    }
    case 'gallery': {
      return msg.photos[msg.photos.length - 1].caption!
    }
    default: {
      throw Error('unreachable')
    }
  }
}
