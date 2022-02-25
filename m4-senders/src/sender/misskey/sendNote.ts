import type {
  PostMessage,
  PostMsgPhoto,
  TgPhotoSize,
} from '@m4/commons/src/types'
import type MisskeyApi from './misskeyApi'
import { Config } from '../../types'
import got from 'got'
import { nanoid } from 'nanoid'

import Log from '@m4/commons/src/logger'
import { CreateNoteRequest } from './misskeyApi'
const L = Log('misskey')

export async function sendNote(
  api: MisskeyApi,
  msges: PostMessage[],
  glob: Config
) {
  const username = glob.channel.username
  const token = glob.channel.token
  if (msges.length === 0) return
  if (
    msges.filter((msg) =>
      ['unknown', 'document', 'audio', 'video'].includes(msg.type)
    ).length > 0
  ) {
    L.w(`Unrecognized message type found, skipping`)
    return
  }
  const firstMsg = msges[0]
  const lastMsg = msges[msges.length - 1]
  const text = getText(lastMsg)
  const containsPhoto = firstMsg.type === 'photo' || firstMsg.type === 'gallery'
  const images = containsPhoto
    ? msges.map((x) => (x as PostMsgPhoto).photo)
    : []
  const finishedImages = token
    ? await Promise.all(
        images.map(async (x, i) =>
          uploadAndCommentImage(
            x.photo,
            // for the last photo, the caption is not added to the photo but to the note
            i !== images.length - 1 ? x.caption : undefined,
            api,
            token
          )
        )
      )
    : []
  if (images.length > 0 && !token) {
    L.w('Images found but bot token not found, ignoring images')
  }
  if (finishedImages.length > 0) {
    L.d(`${finishedImages.length} images uploaded`)
  }

  const messageMetaLine = [
    `[Telegram 原文](https://t.me/${username}/${firstMsg.id})`,
  ]

  if (firstMsg.forwarded) {
    const fwd = firstMsg.forwarded
    switch (fwd.as) {
      case 'channel': {
        const ch = fwd.channel
        const srcTitle = ch.type === 'channel' ? ch.title : '消息来源'
        const srcLink =
          ch.type === 'channel' && ch.username
            ? `https://t.me/${ch.username}/${fwd.msgId}`
            : null
        messageMetaLine.push(
          srcLink ? `转发自[${srcTitle}](${srcLink})` : '来自转发'
        )
        break
      }
      case 'anon':
      case 'user':
      case 'anonuser': {
        messageMetaLine.push('来自转发')
        break
      }
    }
  }

  const note: Pick<CreateNoteRequest, 'visibility' | 'text'> &
    Partial<CreateNoteRequest> = {
    visibility: 'public',
    text: text + '\n\n' + messageMetaLine.join(' | '),
  }

  if (finishedImages.length) {
    note.fileIds = finishedImages
  }

  const crNote = await api.createNote(note)
  return {
    id: crNote.createdNote.id,
    url: crNote.createdNote.url!,
  }
}

function getText(msg: PostMessage): string {
  switch (msg.type) {
    case 'text': {
      return msg.text
    }
    case 'photo': {
      return msg.photo.caption!
    }
    case 'gallery': {
      return msg.photo.caption!
    }
    default: {
      throw Error('unreachable')
    }
  }
}

async function uploadAndCommentImage(
  photo: TgPhotoSize[],
  caption: string | undefined,
  misskeyApi: MisskeyApi,
  token: string
): Promise<string> {
  const bestPhoto = photo.sort((a, b) => b.width - a.width)[0]
  const resp = await got
    .post(`https://api.telegram.org/bot${token}/getFile`, {
      json: {
        file_id: bestPhoto.file_id,
      },
      responseType: 'json',
    })
    .then((x) => x.body)
  const filePath = (resp as any).result.file_path
  const ext = filePath.match(/\..+$/)[0]
  const imageBuf = await got
    .get(`https://api.telegram.org/file/bot${token}/${filePath}`)
    .buffer()
  const filename = nanoid(8) + ext
  const mkFile = await misskeyApi.createFile(
    filename,
    imageBuf,
    guessMimeType(ext)
  )
  if (caption) await misskeyApi.editFileComment(mkFile.id, caption)
  return mkFile.id
}

function guessMimeType(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg': {
      return ''
    }
  }
  return ''
}
