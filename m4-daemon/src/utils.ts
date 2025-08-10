import { MessageEntity } from 'grammy/out/types'

export function parseChatId(id: string | number): number | undefined {
  if (typeof id === 'string') {
    if (id === '') return undefined
    id = Number(id)
    if (Number.isNaN(id)) return undefined
  }
  return id
}

export function getHashtags(text: string, entities: MessageEntity[]): string[] {
  return entities
    .filter((x) => x.type === 'hashtag')
    .map((x) => text.slice(x.offset, x.offset + x.length).slice(1))
}
