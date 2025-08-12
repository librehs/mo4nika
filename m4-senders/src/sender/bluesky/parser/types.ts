import type { AppBskyRichtextFacet } from '@atproto/api'

export type RichtextFacet = AppBskyRichtextFacet.Main

export type BskyRichtextMessage = {
  text: string
  facets: RichtextFacet[]
}
