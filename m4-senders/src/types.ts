export type DbConfig = {
  db: 'mongodb'
  url: string
}

type ChannelInfo = {
  username: string
  token?: string
}

type PlatformAgnosticConfig = {
  // tne amount of message to send at a time
  bulkMessageLimit: number
  // don't send too new messages in case of an incomplete MediaGroup
  sendAfterSeconds: number
}

export type MisskeyConfig = {
  enabled: boolean
  domain: string
  token: string

  // Whether to bring the reply relationship on Telegram to Misskey
  attachReply?: boolean
} & PlatformAgnosticConfig

export type BlueskyConfig = {
  enabled: boolean
  username: string
  password: string
  service: string
} & PlatformAgnosticConfig

export type Config = {
  db: DbConfig
  channel: ChannelInfo
  misskey?: MisskeyConfig
  bluesky?: BlueskyConfig
}
