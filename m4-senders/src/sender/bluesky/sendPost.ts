import { AtpAgent } from '@atproto/api'
import type {
  BlueskyMessageMeta,
  BlueskyMessageThreadMeta,
  PostMessage,
} from '@m4/commons/src/types'
import { Config } from '../../types'
import type { Collection } from 'mongodb'
import { PhotoSize } from 'grammy/out/types.node'

import Log from '@m4/commons/src/logger'
import {
  getForwardSource,
  getTelegramImage,
  getText,
  splitText,
} from '../utils'
import getBlueskyMarkup from './parser'
const L = Log('bluesky')

export async function sendPost(
  agent: AtpAgent,
  msgs: PostMessage[],
  glob: Config,
  $posts: Collection<PostMessage>
): Promise<BlueskyMessageThreadMeta | null> {
  const username = glob.channel.username
  const token = glob.channel.token

  if (msgs.length === 0) return null
  if (
    msgs.filter((msg) =>
      ['unknown', 'document', 'audio', 'video'].includes(msg.type)
    ).length > 0
  ) {
    L.w(`Unrecognized message type found, skipping`)
    return null
  }
  const firstMsg = msgs[0].message
  const bskyMarkup = getBlueskyMarkup(
    getText(firstMsg) ?? '',
    firstMsg.entities ?? [],
    ['phone_number', 'custom_emoji']
  )
  const containsPhoto = Boolean(firstMsg.photo)
  const images = containsPhoto ? msgs.map((x) => x.message.photo!) : []
  const finishedImages = token
    ? await Promise.all(
        images.map(async (x, i) =>
          uploadAndCommentImage(
            x,
            // for the last photo, the caption is not added to the photo but to the note
            i !== images.length - 1 ? msgs[i].message.caption : undefined,
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

  // TODO: parse to Bsky
  // const messageMetaLine = [
  //   `[Telegram 原文](https://t.me/${username}/${firstMsg.id})`,
  // ]

  // const messageMetaPreLine = []

  // const forwardInfo = getForwardSource(firstMsg)
  // if (forwardInfo) {
  //   switch (forwardInfo.as) {
  //     case 'channel': {
  //       const ch = forwardInfo.channel
  //       const srcTitle = ch.type === 'channel' ? ch.title : '消息来源'
  //       const srcLink =
  //         ch.type === 'channel' && ch.username
  //           ? `https://t.me/${ch.username}/${forwardInfo.msgId}`
  //           : null
  //       messageMetaPreLine.push(
  //         srcLink ? `【转发自[${srcTitle}](${srcLink})】` : '【来自转发】'
  //       )
  //       break
  //     }
  //     case 'anon':
  //     case 'user':
  //     case 'anonuser': {
  //       messageMetaPreLine.push('【来自转发】')
  //       break
  //     }
  //   }
  // }

  const replyTo = firstMsg.reply_to_message
    ? (
        await $posts.findOne<PostMessage>({
          id: {
            $eq: firstMsg.reply_to_message.message_id,
          },
        })
      )?.bluesky
    : undefined

  // TODO: remove all Markdown markup except for links
  // TODO: don't split between links
  // const splitFullTextParts = splitText(fullText, 300) // Bsky has a 300 cap

  const post: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    langs: ['zh'],
    createdAt: new Date().toISOString(),
    ...bskyMarkup,
  }

  if (finishedImages.length) {
    post.embed = {
      $type: 'app.bsky.embed.images',
      images: finishedImages,
    }
  }

  if (replyTo) {
    // If it's message thread, root <- parent, parent = parent
    post.reply = {
      root: replyTo.root,
      parent: replyTo.self,
    }
  }

  const resp = await agent.com.atproto.repo.createRecord({
    repo: agent.session!.did,
    collection: 'app.bsky.feed.post',
    record: post,
  })

  if (resp.success) {
    const { uri, cid } = resp.data
    const topMsg = { uri, cid }

    // let lastMsg: BlueskyMessageMeta = { uri, cid }
    // for (let textPart of splitFullTextParts.slice(1)) {
    //   const thisMsg = await agent
    //     .post({
    //       text: textPart,
    //       reply: {
    //         root: replyTo?.root ?? topMsg,
    //         parent: lastMsg,
    //       },
    //     })
    //     .catch((x) => {
    //       // Don't throw on sub-message failures
    //       L.e(`Bluesky sub-message failed: ${x}`)
    //     })
    //   if (thisMsg) {
    //     lastMsg = thisMsg
    //   }
    // }

    return {
      root: replyTo?.root ?? topMsg,
      self: topMsg,
    }
  } else {
    throw new Error(`Failed to send to Bsky: ${JSON.stringify(resp.data)}`)
  }
}

async function uploadAndCommentImage(
  photos: PhotoSize[],
  caption: string | undefined,
  agent: AtpAgent,
  token: string
): Promise<unknown> {
  const { imageBuf } = await getTelegramImage(photos, token)
  const { data } = await agent.com.atproto.repo.uploadBlob(
    new Uint8Array(imageBuf)
  )
  return {
    image: {
      $type: 'blob',
      ...data.blob,
    },
    alt: caption,
  }
}
