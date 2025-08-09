import type {
  Message as TgMessage,
  PhotoSize as TgPhotoSize,
} from 'grammy/out/types'
import got from 'got'
import { ForwardInfo } from './types'

function isPhotoOrGallery(msg: TgMessage): boolean {
  return Boolean(msg.media_group_id || msg.photo)
}

export function getText(msg: TgMessage): string | undefined {
  if (isPhotoOrGallery(msg)) {
    return msg.caption
  }

  return msg.text
}

export async function getTelegramImage(
  photo: TgPhotoSize[],
  token: string
): Promise<{ imageBuf: Buffer; filePath: string }> {
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
  const imageBuf = await got
    .get(`https://api.telegram.org/file/bot${token}/${filePath}`)
    .buffer()
  return { imageBuf, filePath }
}

export function splitText(text: string, splitLength: number): string[] {
  splitLength = splitLength - 14 // consider the `... [x/N]` part
  const parts: string[] = []
  const totalParts = Math.ceil(text.length / splitLength)
  for (let i = 0; i < text.length; i += splitLength) {
    const part = text.substring(i, i + splitLength)
    const partNumber = Math.floor(i / splitLength) + 1
    if (partNumber < totalParts) {
      parts.push(`${part}... [${partNumber}/${totalParts}]`)
    } else {
      parts.push(`${part} [${totalParts}/${totalParts}]`)
    }
  }
  return parts
}

export function getForwardSource(m: TgMessage): ForwardInfo | null {
  if (m.forward_from_message_id) {
    // 1. From a channel
    return {
      as: 'channel',
      msgId: m.forward_from_message_id,
      channel: m.forward_from_chat!,
      sig: m.forward_signature,
    }
  }
  if (m.forward_from_chat && !m.forward_from_message_id) {
    // 2. From an anon (as a chanenl)
    return {
      as: 'anon',
      channel: m.forward_from_chat,
      sig: m.forward_signature,
    }
  }
  if (m.forward_from) {
    // 3. From a linked user
    return {
      as: 'user',
      user: m.forward_from,
    }
  }
  if (m.forward_sender_name) {
    // 4. From an unlinked user
    return {
      as: 'anonuser',
      name: m.forward_sender_name,
    }
  }

  return null
}
