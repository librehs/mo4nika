import type {
  Audio,
  Chat,
  PhotoSize,
  User,
  Document,
  Video,
} from 'grammy/out/platform.node'

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

export type PostMessageMeta = {
  id: number
  type: string
  date: Date
  editDate?: Date
  tags: string[]
  forwarded?: ForwardInfo
  replyTo?: number
  sig?: string
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
