import { describe, it } from 'mocha'
import { expect } from 'chai'
import parseTextEntities, { parseHeaders } from './textEntities'
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
      'test <b>bold</b> <i>italic</i> underline\n' +
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

const urlTextLinkMsg = {
  caption: 'p1 https://t.co\np2 t.tt\np3 sample\np4 sample',
  caption_entities: [
    { offset: 3, length: 12, type: 'url' },
    { offset: 19, length: 4, type: 'url' },
    { offset: 27, length: 7, type: 'text_link', url: 'http://t.tt/' },
    { offset: 37, length: 6, type: 'text_link', url: 'https://t.tt/' },
  ],
  target: {
    md:
      'p1 [https://t.co](https://t.co)\n' +
      'p2 [t.tt](http://t.tt)\n' +
      'p3 [sample](http://t.tt/)\n' +
      'p4 [sample](https://t.tt/)',
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

  it('can parse url and text_link', () => {
    const ret = parseTextEntities(
      urlTextLinkMsg.caption,
      urlTextLinkMsg.caption_entities as MessageEntity[]
    )
    expect(ret.md).to.be.deep.eq(urlTextLinkMsg.target.md)
  })
})

describe('parseHeaders', () => {
  it('basic test', () => {
    expect(parseHeaders('Foo: Bar')).to.be.deep.eq({ foo: 'Bar' })
    expect(parseHeaders('Foo: Bar\nFoo: Baz')).to.be.deep.eq({ foo: 'Baz' })
    expect(parseHeaders('CVE-ID: CVE-2021-12345\nCVSS: 8.3')).to.be.deep.eq({
      'cve-id': 'CVE-2021-12345',
      cvss: '8.3',
    })
    expect(parseHeaders('Never Gonna: Give You Up')).to.be.deep.eq({})
    expect(parseHeaders('Never-Gonna: Give You Up')).to.be.deep.eq({
      'never-gonna': 'Give You Up',
    })
    expect(parseHeaders('G-co: [gco](https://g.co)')).to.be.deep.eq({
      'g-co': '[gco](https://g.co)',
    })
  })
})
