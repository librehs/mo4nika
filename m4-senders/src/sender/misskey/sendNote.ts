import type MisskeyApi from './misskeyApi'
import { Config } from '../../types'
import { nanoid } from 'nanoid'
import type { Collection } from 'mongodb'

import Log from '@m4/commons/src/logger'
import { CreateNoteRequest } from './misskeyApi'
import { getForwardSource, getTelegramImage, getText } from '../utils'
import { PostMessage } from '@m4/commons/src/types'
import { PhotoSize } from 'grammy/out/types.node'
import { getMfmText } from './parser'
const L = Log('misskey')

export async function sendNote(
  api: MisskeyApi,
  msgs: PostMessage[],
  glob: Config,
  $posts: Collection<PostMessage>
) {
  const username = glob.channel.username
  const token = glob.channel.token
  if (msgs.length === 0) return
  if (
    msgs.filter((msg) =>
      ['unknown', 'document', 'audio', 'video'].includes(msg.type)
    ).length > 0
  ) {
    L.w(`Unrecognized message type found, skipping`)
    return
  }
  const firstMsg = msgs[0].message
  const text = getMfmText(getText(firstMsg) ?? '', firstMsg.entities ?? [], [
    'phone_number',
    'custom_emoji',
  ])
  const containsPhoto = Boolean(firstMsg.photo)
  const images = containsPhoto ? msgs.map((x) => x.message.photo!) : []
  const finishedImages = token
    ? await Promise.all(
        images.map(async (x, i) =>
          uploadAndCommentImage(
            x,
            // for the last photo, the caption is not added to the photo but to the note
            i !== images.length - 1 ? msgs[i].message.caption : undefined,
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
    `[Telegram 原文](https://t.me/${username}/${firstMsg.message_id})`,
  ]

  const messageMetaPreLine = []

  const forwardInfo = getForwardSource(firstMsg)
  if (forwardInfo) {
    switch (forwardInfo.as) {
      case 'channel': {
        const ch = forwardInfo.channel
        const srcTitle = ch.type === 'channel' ? ch.title : '消息来源'
        const srcLink =
          ch.type === 'channel' && ch.username
            ? `https://t.me/${ch.username}/${forwardInfo.msgId}`
            : null
        messageMetaPreLine.push(
          srcLink ? `【转发自[${srcTitle}](${srcLink})】` : '【来自转发】'
        )
        break
      }
      case 'anon':
      case 'user':
      case 'anonuser': {
        messageMetaPreLine.push('【来自转发】')
        break
      }
    }
  }

  const replyTo = firstMsg.reply_to_message
    ? (
        await $posts.findOne<PostMessage>({
          id: {
            $eq: firstMsg.reply_to_message.message_id,
          },
        })
      )?.misskey?.id
    : undefined

  const note: Pick<CreateNoteRequest, 'visibility' | 'text'> &
    Partial<CreateNoteRequest> = {
    visibility: 'public',
    text:
      (messageMetaPreLine ? messageMetaPreLine.join(' | ') + '\n\n' : '') +
      text +
      '\n\n' +
      messageMetaLine.join(' | '),
  }

  if (finishedImages.length) {
    note.fileIds = finishedImages
  }

  if (glob?.misskey?.attachReply && replyTo) {
    note.replyId = replyTo
  }

  const crNote = await api.createNote(note)
  return {
    id: crNote.createdNote.id,
  }
}

async function uploadAndCommentImage(
  photo: PhotoSize[],
  caption: string | undefined,
  misskeyApi: MisskeyApi,
  token: string
): Promise<string> {
  const { imageBuf, filePath } = await getTelegramImage(photo, token)
  const ext = filePath.match(/\..+$/)?.[0] ?? ''
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
