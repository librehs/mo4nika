import { Bot } from 'grammy'

import type { Message, Sender, Result, ImageItem } from '@m4/commons/src/types'
import { InputMediaPhoto } from 'grammy/out/platform.node'

export interface Config {
  botToken: string
  chatId: string
}

export class TelegramSender implements Sender {
  #bot: Bot
  #chatId: string

  constructor(config: Config) {
    this.#bot = new Bot(config.botToken)
    this.#chatId = config.chatId
  }

  async sendMessage(m: Message) {
    switch (m.type) {
      case 'text': {
        const msg = await this.#bot.api.sendMessage(this.#chatId, m.text)
        return { ok: true, identifer: `tg:${msg.chat.id}/${msg.message_id}` }
      }
      case 'image': {
        const getIdentifer = (img: ImageItem) =>
          img.obj.type === 'telegram' ? img.obj.file_id : img.obj.url

        if (m.images.length === 1) {
          const img = m.images[0]
          const identifer = getIdentifer(img)

          const msg = await this.#bot.api.sendPhoto(this.#chatId, identifer, {
            caption: img.alt,
          })
          return { ok: true, identifer: `tg:${msg.chat.id}/${msg.message_id}` }
        } else {
          const media: InputMediaPhoto[] = m.images.map((x) => ({
            type: 'photo',
            media: getIdentifer(x),
            caption: x.alt,
          }))
          const msg = await this.#bot.api.sendMediaGroup(this.#chatId, media)
          return {
            ok: true,
            identifer: `tg:multi:${msg[0].chat.id}/${msg[0].message_id}`,
          }
        }
      }
    }
  }
}
