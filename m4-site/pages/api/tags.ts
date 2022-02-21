import Secret from '../../secretConfig'
import type { WithOk } from '../../utils/types'
import { toNumber } from '../../utils/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

import { POSTS_COLLECTION } from '@m4/commons/src/constants'
import type { PostMessage } from '@m4/commons/src/types'

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<WithOk<any>>
) {
  const data = await query().catch((x) => {
    res.status(500).json({
      ok: false,
      reason: x.toString(),
    })
    return null
  })
  if (data === null) return

  res.status(200).json({ ok: true, data })
}

export async function query(): Promise<string[]> {
  const client = new MongoClient(Secret.url)
  try {
    await client.connect()
  } catch (_) {
    throw Error('Cannot connect to db')
  }

  const $posts = client.db().collection<PostMessage>(POSTS_COLLECTION)
  // TODO: find ways to build pagination
  return await $posts.distinct('tags', {})
}
