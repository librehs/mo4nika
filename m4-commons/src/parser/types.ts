import type { Chat, PhotoSize, User } from 'grammy/out/platform.node'

type ForwardUserInfo = {
  as: 'user'
  user: User
}

type ForwardAnonInfo = {
  as: 'anon'
  channel: Chat
}

type ForwardChannelInfo = {
  as: 'channel'
  channel: Chat
  id: number
}

type ForwardInfo = ForwardUserInfo | ForwardChannelInfo | ForwardAnonInfo

export type PostMessageMeta = {
  id: number
  type: string
  date: Date
  editDate?: Date
  tags: string[]
  forwarded?: ForwardInfo
}

type PostMsgText = {
  type: 'text'
  text: string
} & PostMessageMeta

type GallaryPhoto = {
  photo: PhotoSize[]
  caption?: string
}

export type PostMsgPhoto = {
  type: 'photo'
  photos: GallaryPhoto[]
} & PostMessageMeta

export type PostMsgGallery = {
  type: 'gallery'
  mediaGroupId: string
  photos: GallaryPhoto[]
} & PostMessageMeta

type PostMsgUnknown = {
  type: 'unknown'
  raw: any
} & PostMessageMeta

export type PostMessage =
  | PostMsgText
  | PostMsgGallery
  | PostMsgPhoto
  | PostMsgUnknown
