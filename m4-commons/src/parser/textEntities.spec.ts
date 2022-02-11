import { describe, it } from 'mocha'
import { expect } from 'chai'
import parseTextEntities from './textEntities'
import { MessageEntity } from 'grammy/out/platform.node'

const msg = {
  caption: 'test1 - 2 3 4\nand...\nconsole.log("HAI"); ~\n\nff\nff\nend',
  caption_entities: [
    {
      offset: 3,
      length: 2,
      type: 'text_link',
      url: 'https://bing.com/',
    },
    { offset: 21, length: 19, type: 'code' },
    { offset: 44, length: 6, type: 'code' },
  ],
  target:
    'tes[t1](https://bing.com/) - 2 3 4\nand...\n`console.log("HAI");` ~\n\n```\nff\nff\n```\nend',
}

describe('parseTextEntities', () => {
  it('can parse mixed text', () => {
    expect(
      parseTextEntities(msg.caption, msg.caption_entities as MessageEntity[])
    ).to.be.deep.eq(msg.target)
  })
})
