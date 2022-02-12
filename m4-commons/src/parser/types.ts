import type { PhotoSize } from 'grammy/out/platform.node'

export type PostMessageMeta = {
  id: number
  type: string
  date: Date
  editDate?: Date
  tags: string[]
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
