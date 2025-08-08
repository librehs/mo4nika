import Secret from '../../secretConfig'
import type { WithOk } from '../../utils/types'
import { toNumber } from '../../utils/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

import { POSTS_COLLECTION } from '@m4/commons/src/constants'
import type { PostMessage } from '@m4/commons/src/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WithOk<any>>
) {
  const {
    query: { page: _page, perpage: _perpage },
  } = req

  if (_page === undefined || _perpage === undefined) {
    res.status(400).json({ ok: false, reason: 'Invalid page/perpage' })
    return
  }

  const page = Math.max(toNumber(_page, 1), 1)
  const perpage = toNumber(_perpage, 15)

  const data = await query(page, perpage).catch((e) => {
    res.status(500).json({ ok: false, reason: e.toString() })
    return null
  })

  if (data === null) return

  res.status(200).json({ ok: true, data })
}

export async function query(page: number, perpage: number) {
  const skip = (page - 1) * perpage

  const client = new MongoClient(Secret.url)
  try {
    await client.connect()
  } catch (_) {
    throw Error('Cannot connect to db')
  }

  const $posts = client.db().collection<PostMessage>(POSTS_COLLECTION)
  return await $posts
    .find({}, { sort: { id: -1 }, limit: perpage, skip })
    .toArray()
}
