import { AtpAgent } from '@atproto/api'
import type { BlobRef } from '@atproto/api'
import type {
  BlueskyMessageMeta,
  BlueskyMessageThreadMeta,
  PostMessage,
} from '@m4/commons/src/types'
import { Config } from '../../types'
import type { Collection } from 'mongodb'
import { PhotoSize } from 'grammy/out/types.node'
import Log from '@m4/commons/src/logger'
import { getForwardSource, getTelegramImage, getText } from '../utils'
import getRichText, {
  createLinkRichText,
  createTextRichText,
  LF,
  mergeRichTexts,
  splitRichText,
} from './parser'
import { BskyRichtextMessage } from './parser/types'

const L = Log('bluesky')
const MAX_MESSAGE_LENGTH = 299

export async function sendPost(
  agent: AtpAgent,
  msgs: PostMessage[],
  glob: Config,
  $posts: Collection<PostMessage>,
): Promise<BlueskyMessageThreadMeta | null> {
  const username = glob.channel.username
  const token = glob.channel.token

  if (msgs.length === 0) return null
  if (
    msgs.filter((msg) =>
      ['unknown', 'document', 'audio', 'video'].includes(msg.type),
    ).length > 0
  ) {
    L.w(`Unrecognized message type found, skipping`)
    return null
  }
  const firstMsg = msgs[0].message
  const baseRichText = getRichText(
    getText(firstMsg) ?? '',
    firstMsg.entities ?? [],
    ['phone_number', 'custom_emoji'],
  )
  const containsPhoto = Boolean(firstMsg.photo)
  const images = containsPhoto ? msgs.map((x) => x.message.photo!) : []
  const finishedImages = token
    ? await Promise.all(
        images.map(async (x, i) => uploadAndCommentImage(x, agent, token)),
      )
    : []
  if (images.length > 0 && !token) {
    L.w('Images found but bot token not found, ignoring images')
  }
  if (finishedImages.length > 0) {
    L.d(`${finishedImages.length} images uploaded`)
  }

  const preMsgRichtexts: BskyRichtextMessage[] = []
  const forwardInfo = getForwardSource(firstMsg)
  if (forwardInfo) {
    switch (forwardInfo.as) {
      case 'channel': {
        const ch = forwardInfo.channel
        const srcTitle = ch.type === 'channel' ? ch.title : '消息来源'
        const srcLink =
          ch.type === 'channel' && ch.username
            ? `https://t.me/${ch.username}/${forwardInfo.msgId}`
            : null
        preMsgRichtexts.push(
          srcLink
            ? mergeRichTexts([
                createTextRichText('【转发自'),
                createLinkRichText(srcTitle, srcLink),
                createTextRichText('】'),
              ])
            : createTextRichText('【来自转发】'),
        )
        break
      }
      case 'anon':
      case 'user':
      case 'anonuser': {
        preMsgRichtexts.push(createTextRichText('【来自转发】'))
        break
      }
    }
  }

  const postMsgRichtexts = [
    createLinkRichText(
      'Telegram 原文',
      `https://t.me/${username}/${firstMsg.message_id}`,
    ),
  ]

  const finalRichText = mergeRichTexts([
    // every line of pre-content text is joined with an empty line
    ...preMsgRichtexts.map((x) => [x, LF()]).reduce((a, b) => [...a, ...b], []),
    // pre-content texts need an empty line
    ...(preMsgRichtexts.length > 0 ? [LF()] : []),
    baseRichText,
    // post-content texts need an empty line
    ...(postMsgRichtexts.length > 0 ? [LF()] : []),
    // every line of post-content text is joined with an empty line
    ...postMsgRichtexts
      .map((x) => [LF(), x])
      .reduce((a, b) => [...a, ...b], []),
  ])
  const splitBskyMsgs = splitRichText(finalRichText, MAX_MESSAGE_LENGTH)

  const replyTo = firstMsg.reply_to_message
    ? (
        await $posts.findOne<PostMessage>({
          id: {
            $eq: firstMsg.reply_to_message.message_id,
          },
        })
      )?.bluesky
    : undefined

  const post: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    langs: ['zh'],
    createdAt: new Date().toISOString(),
    ...splitBskyMsgs[0],
  }

  if (finishedImages.length) {
    post.embed = {
      $type: 'app.bsky.embed.images',
      images: finishedImages.map((img) => ({
        alt: '',
        image: img,
      })),
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

    let lastMsg: BlueskyMessageMeta = { uri, cid }
    const otherMsgs = splitBskyMsgs.slice(1)
    for (const part of otherMsgs) {
      const thisMsg = await agent
        .post({
          ...part,
          langs: ['zh'],
          reply: {
            root: replyTo?.root ?? topMsg,
            parent: lastMsg,
          },
        })
        .catch((x) => {
          // Don't throw on sub-message failures
          L.e(`Bluesky sub-message failed: ${x}`)
        })
      if (thisMsg) {
        lastMsg = thisMsg
      }
    }

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
  agent: AtpAgent,
  token: string,
): Promise<BlobRef> {
  const { imageBuf } = await getTelegramImage(photos, token)
  const { data } = await agent.com.atproto.repo.uploadBlob(
    new Uint8Array(imageBuf),
  )
  return data.blob
}
