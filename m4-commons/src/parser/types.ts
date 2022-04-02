import type {
  Audio,
  Chat,
  PhotoSize,
  User,
  Document,
  Video,
  MessageEntity,
} from 'grammy/out/platform.node'

export type TgPhotoSize = PhotoSize

type ForwardUserInfo = {
  as: 'user'
  user: User
}

type ForwardAnonUserInfo = {
  as: 'anonuser'
  name: string
}

type ForwardAnonInfo = {
  as: 'anon'
  channel: Chat
  sig?: string
}

type ForwardChannelInfo = {
  as: 'channel'
  channel: Chat
  msgId: number
  sig?: string
}

type ForwardInfo =
  | ForwardUserInfo
  | ForwardChannelInfo
  | ForwardAnonInfo
  | ForwardAnonUserInfo

type PostMessageExternalMeta = {
  misskey: {
    id: string
  }
}

export type PostMessageMeta = {
  id: number
  type: string
  date: Date
  editDate?: Date
  tags: string[]
  forwarded?: ForwardInfo
  replyTo?: number
  sig?: string
  isImported?: boolean
  headers?: Record<string, string>
} & Partial<PostMessageExternalMeta>

export type PostMsgText = {
  type: 'text'
  text: string
} & PostMessageMeta

type GallaryPhoto = {
  photo: PhotoSize[]
  caption?: string
}

export type PostMsgPhoto = {
  type: 'photo'
  photo: GallaryPhoto
} & PostMessageMeta

export type PostMsgGallery = {
  type: 'gallery'
  mediaGroupId: string
  photo: GallaryPhoto
} & PostMessageMeta

type PostMsgAudio = {
  type: 'audio'
  audio: Audio
} & PostMessageMeta

type PostMsgDocument = {
  type: 'document'
  document: Document
} & PostMessageMeta

type PostMsgVideo = {
  type: 'video'
  video: Video
} & PostMessageMeta

type PostMsgUnknown = {
  type: 'unknown'
  raw: any
} & PostMessageMeta

export type PostMessage =
  | PostMsgText
  | PostMsgGallery
  | PostMsgPhoto
  | PostMsgAudio
  | PostMsgDocument
  | PostMsgVideo
  | PostMsgUnknown

export type MediaGroup = {
  mediaGroupId: string
  items: (PostMsgGallery | PostMsgPhoto)[]
}

export type MessageEntityType =
  | MessageEntity.CommonMessageEntity['type']
  | MessageEntity.TextLinkMessageEntity['type']
  | MessageEntity.TextMentionMessageEntity['type']
  | MessageEntity.PreMessageEntity['type']
