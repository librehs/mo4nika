interface RemoteImage {
  type: 'remote'
  url: string
}

interface TelegramImage {
  type: 'telegram'
  file_id: string
}

type Image = RemoteImage | TelegramImage

export interface ImageItem {
  /// the image object.
  obj: Image
  /// alternative text. preferable plaintext.
  alt?: string
}

interface TextMessage {
  type: 'text'
  text: string
}

interface ImageMessage {
  type: 'image'
  text: string
  images: ImageItem[]
}

export type Message = TextMessage | ImageMessage

export interface Result {
  ok: boolean
  message?: any
}

export interface SendResult extends Result {
  identifer: string
}

export interface Sender {
  sendMessage: (m: Message) => Promise<SendResult | Result>
}
