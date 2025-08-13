import { RichText } from '@atproto/api'
import type { BskyRichtextMessage } from './types'

export const parse = (msg: BskyRichtextMessage) => [
  ...new RichText(msg).segments(),
]
