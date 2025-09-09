import type { MessageEntity } from 'grammy/out/types'
import { splitText } from '../../utils'
import type { BskyRichtextMessage, RichtextFacet } from './types'

const encoder = new TextEncoder()

function getByteSize(text: string): number {
  return encoder.encode(text).length
}

function getTotalByteSizes(texts: string[]): number[] {
  const sizes = texts.map(getByteSize)
  const ret: number[] = []
  for (const i of sizes) {
    if (ret.length === 0) {
      ret.push(i)
    } else {
      ret.push(i + ret[ret.length - 1])
    }
  }
  return ret
}

export function toUrl(url: string): string {
  try {
    new URL(url)
    return url
  } catch (_) {
    return 'https://' + url
  }
}

export function getMappingToUtf8ByteOffset(text: string): number[] {
  // https://docs.bsky.app/docs/advanced-guides/post-richtext#text-encoding-and-indexing
  const mapping: number[] = []
  for (let i = 0; i < text.length; i++) {
    const textPart = text.slice(0, i)
    mapping[i] = getByteSize(textPart)
  }
  mapping.push(getByteSize(text))
  return mapping
}

// Note: not used for now
export function getAllTagFacets(
  text: string,
  mapping: readonly number[]
): RichtextFacet[] {
  const ret: RichtextFacet[] = []
  const regex = /#\w+/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const startChar = match.index
    const endChar = match.index + match[0].length
    const startByte = mapping[startChar]
    const endByte = mapping[endChar]
    ret.push({
      index: {
        byteStart: startByte,
        byteEnd: endByte,
      },
      features: [
        {
          $type: 'app.bsky.richtext.facet#tag',
          tag: match[0].slice(1), // remove `#`
        },
      ],
    })
  }
  return ret
}

export function entityToFacet(
  text: string,
  entity: MessageEntity,
  mapping: readonly number[]
): RichtextFacet | null {
  const index = {
    byteStart: mapping[entity.offset],
    byteEnd: mapping[entity.offset + entity.length],
  }
  const partText = text.slice(entity.offset, entity.offset + entity.length)
  switch (entity.type) {
    case 'text_link': {
      return {
        index,
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: entity.url,
          },
        ],
      }
    }
    case 'url': {
      return {
        index,
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: toUrl(partText),
          },
        ],
      }
    }
    case 'hashtag': {
      return {
        index,
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: partText.slice(1), // remove `#`
          },
        ],
      }
    }
    default: {
      return null
    }
  }
}

export function splitRichText(
  m: BskyRichtextMessage,
  splitLength: number
): BskyRichtextMessage[] {
  if (m.text.length <= splitLength) {
    // No need to split
    return [m]
  }

  splitLength = splitLength - ' ... [01/99]'.length // consider the `... [x/N]` part
  const splitTexts = splitText(m.text, splitLength)
  const msgs: BskyRichtextMessage[] = splitTexts.map((x) => ({
    text: x,
    facets: [],
  }))
  const splitTextsTotalByteSize = getTotalByteSizes(
    // add `\n` for all but the last message to keep original offset
    splitTexts.map((r, i) => r + (i + 1 === splitTexts.length ? '' : '\n'))
  )

  for (const facet of m.facets) {
    const startByte = facet.index.byteStart
    for (let [index, totalByteSize] of splitTextsTotalByteSize.entries()) {
      if (startByte >= totalByteSize) {
        continue
      }
      const lastTotalByteSize =
        index === 0 ? 0 : splitTextsTotalByteSize[index - 1]
      const { byteStart, byteEnd } = facet.index
      msgs[index].facets.push({
        ...facet,
        index: {
          byteStart: byteStart - lastTotalByteSize,
          byteEnd: byteEnd - lastTotalByteSize,
        },
      })
      break // check the next facet
    }
  }

  for (const [index, msg] of msgs.entries()) {
    msg.text += ` ${index + 1 < msgs.length ? '... ' : ''}[${index + 1}/${
      msgs.length
    }]`
  }

  return msgs
}

export function mergeRichTexts(a: BskyRichtextMessage[]): BskyRichtextMessage {
  if (a.length === 0)
    return {
      text: '',
      facets: [],
    }
  let ret = a[0]
  for (let i = 1; i < a.length; i++) {
    ret = mergeRichText(ret, a[i])
  }
  return ret
}

function mergeRichText(
  a: BskyRichtextMessage,
  b: BskyRichtextMessage
): BskyRichtextMessage {
  const aLen = getByteSize(a.text)
  return {
    text: a.text + b.text,
    facets: [
      ...a.facets,
      ...b.facets.map((x) => ({
        ...x,
        index: {
          byteStart: x.index.byteStart + aLen,
          byteEnd: x.index.byteEnd + aLen,
        },
      })),
    ],
  }
}

export function createTextRichText(text: string): BskyRichtextMessage {
  return {
    text,
    facets: [],
  }
}

export function createLinkRichText(
  text: string,
  uri: string
): BskyRichtextMessage {
  return {
    text,
    facets: [
      {
        index: {
          byteStart: 0,
          byteEnd: getByteSize(text),
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',

            uri,
          },
        ],
      },
    ],
  }
}

export default function getRichText(
  text: string,
  entities: MessageEntity[],
  disabledTypes: string[] = []
): BskyRichtextMessage {
  const mapping = getMappingToUtf8ByteOffset(text)
  const facets = entities
    .filter((x) => !disabledTypes.includes(x.type))
    .map((x) => entityToFacet(text, x, mapping))
    .filter(<T>(x: T | null): x is T => Boolean(x))

  return {
    text,
    facets,
  }
}

export const LF = () => createTextRichText('\n')
