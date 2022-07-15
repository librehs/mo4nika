import type { MessageEntity } from 'grammy/out/platform.node'
import type { MessageEntityType } from './types'

const HeaderRegEx = /^([A-Za-z-]+): (.+)/

export function parseTextSegment(
  rawText: string,
  typ: MessageEntityType,
  uid: string | undefined,
  url: string | undefined
): {
  text: string
  tags: string[]
} {
  const tags: string[] = []
  const tailBr = rawText.match(/\n+$/) !== null ? rawText.match(/\n+$/)![0] : ''
  const headBr = rawText.match(/^\n+/) !== null ? rawText.match(/^\n+/)![0] : ''
  rawText = rawText.replace(/^\n+/, '').replace(/\n+$/, '')

  switch (typ) {
    // Links
    case 'url': {
      rawText = `[${rawText}](<${toValidUrl(rawText)}>)`
      break
    }
    case 'email': {
      rawText = `[${rawText}](mailto:${rawText})`
      break
    }
    case 'phone_number': {
      rawText = `[${rawText}](tel:${rawText})`
      break
    }

    // Formatting
    case 'bold': {
      rawText = '<b>' + rawText + '</b>'
      break
    }
    case 'italic': {
      rawText = '<i>' + rawText + '</i>'
      break
    }
    case 'underline': {
      // not implemented yet
      break
    }
    case 'strikethrough': {
      rawText = '~~' + rawText + '~~'
      break
    }
    case 'spoiler': {
      rawText = `$[blur ${rawText}]`
      break
    }
    case 'code': {
      const multiLine = rawText.includes('\n')
      rawText = multiLine //
        ? '```\n' + rawText + '\n```'
        : '`' + rawText + '`'
      break
    }
    case 'pre': {
      rawText = '```\n' + rawText + '\n```'
      break
    }

    case 'text_link': {
      rawText = `[${rawText}](${url})`
      break
    }
    case 'text_mention': {
      rawText = `[${rawText}](tg://user?id=${uid})`
      break
    }

    case 'hashtag': {
      tags.push(rawText.replace(/^#/, ''))
      break
    }

    case 'mention': {
      rawText = `[${rawText}](https://t.me/${rawText.replace(/^@/, '')})`
      break
    }

    case 'cashtag':
    case 'bot_command': {
      // Nothing needed
      break
    }
  }
  return {
    text: headBr + rawText + tailBr,
    tags,
  }
}

export default function parseTextEntities(
  text: string,
  entities: MessageEntity[],
  disabledTypes: string[] = []
): { md: string; tags: string[]; headers: Record<string, string> } {
  let ret = text
  let tags: string[] = []
  for (const i of entities.sort((x, y) => y.offset - x.offset)) {
    if (disabledTypes.includes(i.type)) continue
    const bef = ret.slice(0, i.offset)
    const aft = ret.slice(i.offset + i.length)
    let mid = ret.slice(i.offset, i.offset + i.length)

    const { text, tags: _tags } = parseTextSegment(
      mid,
      i.type,
      (i as any).user?.id,
      (i as any).url
    )
    tags = tags.concat(_tags)
    ret = bef + text + aft
  }
  return {
    md: ret,
    headers: parseHeaders(text),
    tags,
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (_) {
    return false
  }
}

function toValidUrl(url: string) {
  if (isValidUrl(url)) return url
  return 'http://' + url
}

export function parseHeaders(str: string): Record<string, string> {
  const ret: Record<string, string> = {}
  for (const i of str.split('\n').map((x) => x.trim())) {
    const match = i.match(HeaderRegEx)
    if (match === null) continue
    ret[match[1].toLowerCase()] = match[2]
  }
  return ret
}
