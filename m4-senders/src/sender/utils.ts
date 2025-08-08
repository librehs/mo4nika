import type { PostMessage, TgPhotoSize } from '@m4/commons/src/types'
import got from 'got'

export function getText(msg: PostMessage): string {
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
