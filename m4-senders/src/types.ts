export type DbConfig = {
  db: 'mongodb'
  url: string
}

type ChannelInfo = {
  username: string
}

export type MisskeyConfig = {
  enabled: boolean
  domain: string
  token: string
  // tne amount of message to send at a time
  bulkMessageLimit: number
  // don't send too new messages in case of an incomplete MediaGroup
  sendAfterSeconds: number
}

export type Config = {
  db: DbConfig
  channel: ChannelInfo
  misskey?: MisskeyConfig
}
