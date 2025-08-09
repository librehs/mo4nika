import { AppBskyRichtextFacet } from '@atproto/api'
import type { MessageEntity } from 'grammy/out/types'

type RichtextFacet = AppBskyRichtextFacet.Main

type BskyRichtextMessage = {
  text: string
  facets: RichtextFacet[]
}

export function getMappingToUtf8ByteOffset(text: string): number[] {
  // https://docs.bsky.app/docs/advanced-guides/post-richtext#text-encoding-and-indexing
  const encoder = new TextEncoder()
  const mapping: number[] = []
  for (let i = 0; i < text.length; i++) {
    const bytes = encoder.encode(text.slice(0, i))
    mapping[i] = bytes.length
  }
  mapping.push(encoder.encode(text).length)
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
            uri: partText,
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

export default function getBlueskyMarkup(
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
