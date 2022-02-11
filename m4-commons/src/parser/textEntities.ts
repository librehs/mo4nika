import type { MessageEntity } from 'grammy/out/platform.node'

export default function parseTextEntities(
  text: string,
  entities: MessageEntity[]
): string {
  let ret = text
  for (const i of entities.sort((x, y) => y.offset - x.offset)) {
    const bef = ret.slice(0, i.offset)
    const aft = ret.slice(i.offset + i.length)
    let mid = ret.slice(i.offset, i.offset + i.length)

    switch (i.type) {
      // Links
      case 'url': {
        mid = `[${mid}](${mid})`
        break
      }
      case 'email': {
        mid = `[${mid}](mailto:${mid})`
        break
      }
      case 'phone_number': {
        mid = `[${mid}](tel:${mid})`
        break
      }

      // Formatting
      case 'bold': {
        mid = '**' + mid + '**'
        break
      }
      case 'italic': {
        mid = '*' + mid + '*'
        break
      }
      case 'underline': {
        // not implemented yet
        break
      }
      case 'strikethrough': {
        mid = '~~' + mid + '~~'
        break
      }
      case 'spoiler': {
        // not implemented yet
        break
      }
      case 'code': {
        const multiLine = mid.includes('\n')
        mid = multiLine ? '```\n' + mid + '```\n' : '`' + mid + '`'
        break
      }
      case 'pre': {
        mid = '```\n' + mid + '```\n'
        break
      }

      case 'text_link': {
        mid = `[${mid}](${i.url})`
        break
      }
      case 'text_mention': {
        mid = `[${mid}](tg://user?id=${i.user.id})`
        break
      }

      case 'mention':
      case 'hashtag':
      case 'cashtag':
      case 'bot_command': {
        // Nothing needed
        break
      }
    }

    ret = bef + mid + aft
  }
  return ret
}