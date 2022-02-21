import Secret from '../../../secretConfig'
import type { WithOk } from '../../../utils/types'
import { toNumber } from '../../../utils/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

import { POSTS_COLLECTION } from '@m4/commons/src/constants'
import type { PostMessage } from '@m4/commons/src/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WithOk<any>>
) {
  const {
    query: { page: _page, perpage: _perpage, name },
  } = req

  const page = Math.max(toNumber(_page, 1), 1)
  const perpage = toNumber(_perpage, 15)
  const skip = (page - 1) * perpage

  const client = new MongoClient(Secret.url)
  try {
    await client.connect()
  } catch (_) {
    res.status(500).json({
      ok: false,
      reason: 'Cannot connect to db',
    })
    return
  }

  const $posts = client.db().collection<PostMessage>(POSTS_COLLECTION)
  const data = await $posts
    .find(
      {
        tags: {
          $in: Array.isArray(name) ? name : [name],
        },
      },
      { sort: { id: -1 }, limit: perpage, skip }
    )
    .toArray()

  res.status(200).json({ ok: true, data })
}
