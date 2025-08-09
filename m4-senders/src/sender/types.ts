import { Chat, User } from 'grammy/out/types'

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

export type ForwardInfo =
  | ForwardUserInfo
  | ForwardChannelInfo
  | ForwardAnonInfo
  | ForwardAnonUserInfo
