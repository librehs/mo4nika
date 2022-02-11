interface SaveConfig {
  db: 'mongodb'
  url: string
}

interface SpecializedId {
  chatId: number
  channelId: number
}

interface Feature {
  save?: SaveConfig
}

export interface Config {
  botToken: string
  chatId: number
  channelId: number
  feature?: Feature
  _: SpecializedId
}
