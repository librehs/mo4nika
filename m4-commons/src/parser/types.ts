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

type PostMsgGallary = {
  type: 'gallary'
  mediaGroupId: string
  photos: GallaryPhoto[]
} & PostMessageMeta

type PostMsgUnknown = {
  type: 'unknown'
  raw: any
} & PostMessageMeta

export type PostMessage = PostMsgText | PostMsgGallary | PostMsgUnknown
