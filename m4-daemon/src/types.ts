interface SaveConfig {
  db: 'mongodb'
  url: string
}

interface PublishConfig {
  enabled: boolean
}

interface SpecializedId {
  chatId: number
  channelId: number
}

interface Feature {
  save?: SaveConfig
  publish?: PublishConfig
}

export interface Config {
  botToken: string
  chatId: number
  channelId: number
  feature?: Feature
  _: SpecializedId
}
