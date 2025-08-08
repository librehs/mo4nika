import { AtpAgent } from '@atproto/api'
import type {
  BlueskyMessageMeta,
  PostMessage,
  PostMsgPhoto,
  TgPhotoSize,
} from '@m4/commons/src/types'
import { Config } from '../../types'
import type { Collection } from 'mongodb'

import Log from '@m4/commons/src/logger'
import { getTelegramImage, getText } from '../utils'
const L = Log('bluesky')

export async function sendPost(
  agent: AtpAgent,
  msges: PostMessage[],
  glob: Config,
  $posts: Collection<PostMessage>
): Promise<BlueskyMessageMeta | null> {
  const username = glob.channel.username
  const token = glob.channel.token

  if (msges.length === 0) return null
  if (
    msges.filter((msg) =>
      ['unknown', 'document', 'audio', 'video'].includes(msg.type)
    ).length > 0
  ) {
    L.w(`Unrecognized message type found, skipping`)
    return null
  }
  const firstMsg = msges[0]
  const text = getText(firstMsg)
  const containsPhoto = firstMsg.type === 'photo' || firstMsg.type === 'gallery'
  const images = containsPhoto
    ? msges.map((x) => (x as PostMsgPhoto).photo)
    : []
  const finishedImages = token
    ? await Promise.all(
        images.map(async (x, i) =>
          uploadAndCommentImage(
            x.photo,
            // for the last photo, the caption is not added to the photo but to the note
            i !== images.length - 1 ? x.caption : undefined,
            agent,
            token
          )
        )
      )
    : []
  if (images.length > 0 && !token) {
    L.w('Images found but bot token not found, ignoring images')
  }
  if (finishedImages.length > 0) {
    L.d(`${finishedImages.length} images uploaded`)
  }

  const messageMetaLine = [
    `[Telegram 原文](https://t.me/${username}/${firstMsg.id})`,
  ]

  const messageMetaPreLine = []

  if (firstMsg.forwarded) {
    const fwd = firstMsg.forwarded
    switch (fwd.as) {
      case 'channel': {
        const ch = fwd.channel
        const srcTitle = ch.type === 'channel' ? ch.title : '消息来源'
        const srcLink =
          ch.type === 'channel' && ch.username
            ? `https://t.me/${ch.username}/${fwd.msgId}`
            : null
        messageMetaPreLine.push(
          srcLink ? `【转发自[${srcTitle}](${srcLink})】` : '【来自转发】'
        )
        break
      }
      case 'anon':
      case 'user':
      case 'anonuser': {
        messageMetaPreLine.push('【来自转发】')
        break
      }
    }
  }

  const replyTo = firstMsg.replyTo
    ? (
        await $posts.findOne<PostMessage>({
          id: {
            $eq: firstMsg.replyTo,
          },
        })
      )?.bluesky
    : undefined

  const post: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    text,
    langs: ['zh'],
    createdAt: new Date().toISOString(),
  }

  if (finishedImages.length) {
    post.embed = {
      $type: 'app.bsky.embed.images',
      images: finishedImages,
    }
  }

  if (replyTo) {
    post.reply = {
      root: replyTo,
      parent: replyTo,
    }
  }

  const resp = await agent.com.atproto.repo.createRecord({
    repo: agent.session!.did,
    collection: 'app.bsky.feed.post',
    record: post,
  })

  if (resp.success) {
    const { uri, cid } = resp.data
    return { uri, cid }
  } else {
    throw new Error(`Failed to send to Bsky: ${JSON.stringify(resp.data)}`)
  }
}

async function uploadAndCommentImage(
  photos: TgPhotoSize[],
  caption: string | undefined,
  agent: AtpAgent,
  token: string
): Promise<unknown> {
  const { imageBuf } = await getTelegramImage(photos, token)
  const { data } = await agent.com.atproto.repo.uploadBlob(imageBuf)
  return {
    image: {
      $type: 'blob',
      ...data.blob,
    },
    alt: caption,
  }
}
