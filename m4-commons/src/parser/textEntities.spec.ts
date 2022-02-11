import { describe, it } from 'mocha'
import { expect } from 'chai'
import parseTextEntities from './textEntities'
import { MessageEntity } from 'grammy/out/platform.node'

const msg = {
  caption:
    'test bold italic underline\n' +
    'test link\n' +
    'test console.log\n' +
    'test\n' +
    'console.log("test")\n' +
    'console.log("tset")\n' +
    '\n' +
    '#a #b #c #hashes',
  caption_entities: [
    { offset: 5, length: 4, type: 'bold' },
    { offset: 10, length: 6, type: 'italic' },
    { offset: 17, length: 10, type: 'underline' },
    {
      offset: 32,
      length: 5,
      type: 'text_link',
      url: 'https://bing.com/',
    },
    { offset: 42, length: 12, type: 'code' },
    { offset: 59, length: 41, type: 'code' },
    { offset: 100, length: 2, type: 'hashtag' },
    { offset: 103, length: 2, type: 'hashtag' },
    { offset: 106, length: 2, type: 'hashtag' },
    { offset: 109, length: 7, type: 'hashtag' },
  ],
  target: {
    md:
      'test **bold** *italic* underline\n' +
      'test [link](https://bing.com/)\n' +
      'test `console.log`\n' +
      'test\n' +
      '```\n' +
      'console.log("test")\n' +
      'console.log("tset")\n' +
      '```\n' +
      '\n' +
      '#a #b #c #hashes',
    tags: ['a', 'b', 'c', 'hashes'],
  },
}

describe('parseTextEntities', () => {
  it('can parse mixed text', () => {
    const ret = parseTextEntities(
      msg.caption,
      msg.caption_entities as MessageEntity[]
    )
    expect(ret.md).to.be.deep.eq(msg.target.md)
    expect(ret.tags).to.be.eq(ret.tags)
  })
})
