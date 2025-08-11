import { expect } from 'chai'
import getBlueskyMarkup, {
  getAllTagFacets,
  getMappingToUtf8ByteOffset,
} from './index'
import type { MessageEntity } from 'grammy/out/types'
import { RichText } from '@atproto/api'
import type { BskyRichtextMessage } from './types'

const parse = (msg: BskyRichtextMessage) => [...new RichText(msg).segments()]

describe('getBlueskyMarkup', () => {
  const message = {
    text: 'Kubesphere \u5ba3\u5e03\u505c\u6b62\u5f00\u6e90\u7248\u4e0b\u8f7d\uff0c\u53ea\u63d0\u4f9b\u5546\u4e1a\u7248\u652f\u6301\u3002\u6709\u7528\u6237\u79f0\u5176\u4e5f\u5220\u9664\u4e86\u90e8\u5206\u7ec4\u4ef6\u5bfc\u81f4\u5f00\u6e90\u7248\u65e0\u6cd5\u6b63\u5e38\u4f7f\u7528\u3002\n\n- Kubesphere \u662f\u9752\u4e91 (QingCloud) \u5f00\u53d1\u7684 Kubernetes \u5e73\u53f0\u3002\n\ngh:kubesphere/kubesphere#6550\n\n1. gh:kubesphere/website#3281\n\nlinksrc: t.me/billchenla/2090\n\n#Kubesphere #QingCloud #Opensource',
    entities: [
      {
        offset: 106,
        length: 29,
        type: 'text_link',
        url: 'https://github.com/kubesphere/kubesphere/issues/6550',
      },
      {
        offset: 140,
        length: 26,
        type: 'text_link',
        url: 'https://github.com/kubesphere/website/pull/3281',
      },
      { offset: 177, length: 20, type: 'url' },
      { offset: 199, length: 11, type: 'hashtag' },
      { offset: 211, length: 10, type: 'hashtag' },
      { offset: 222, length: 11, type: 'hashtag' },
    ] as MessageEntity[],
    link_preview_options: {
      url: 'https://github.com/kubesphere/kubesphere/issues/6550?utm_source=Securitylabru',
    },
  }

  const result = [
    {
      facet: undefined,
      text: 'Kubesphere 宣布停止开源版下载，只提供商业版支持。有用户称其也删除了部分组件导致开源版无法正常使用。\n\n- Kubesphere 是青云 (QingCloud) 开发的 Kubernetes 平台。\n\n',
    },
    {
      text: 'gh:kubesphere/kubesphere#6550',
      facet: {
        index: {
          byteStart: 212,
          byteEnd: 241,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: 'https://github.com/kubesphere/kubesphere/issues/6550',
          },
        ],
      },
    },
    { facet: undefined, text: '\n\n1. ' },
    {
      text: 'gh:kubesphere/website#3281',
      facet: {
        index: {
          byteStart: 246,
          byteEnd: 272,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: 'https://github.com/kubesphere/website/pull/3281',
          },
        ],
      },
    },
    { facet: undefined, text: '\n\nlinksrc: ' },
    {
      text: 't.me/billchenla/2090',
      facet: {
        index: {
          byteStart: 283,
          byteEnd: 303,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: 't.me/billchenla/2090',
          },
        ],
      },
    },
    { facet: undefined, text: '\n\n' },
    {
      text: '#Kubesphere',
      facet: {
        index: {
          byteStart: 305,
          byteEnd: 316,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'Kubesphere',
          },
        ],
      },
    },
    { facet: undefined, text: ' ' },
    {
      text: '#QingCloud',
      facet: {
        index: {
          byteStart: 317,
          byteEnd: 327,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'QingCloud',
          },
        ],
      },
    },
    { facet: undefined, text: ' ' },
    {
      text: '#Opensource',
      facet: {
        index: {
          byteStart: 328,
          byteEnd: 339,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'Opensource',
          },
        ],
      },
    },
  ]

  it('should parse the item', () => {
    expect(
      parse(getBlueskyMarkup(message.text, message.entities, []))
    ).to.deep.eq(result)
  })
})

describe('getAllTagFacets', () => {
  const text = `
One tag #tag
测试二 #tagTwo

#Tag3 #Tag4our #tagFivvvve`.trim()

  it('should give tags', () => {
    expect(getAllTagFacets(text, getMappingToUtf8ByteOffset(text))).to.deep.eq([
      {
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'tag',
          },
        ],
        index: {
          byteEnd: 12,
          byteStart: 8,
        },
      },
      {
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'tagTwo',
          },
        ],
        index: {
          byteEnd: 30,
          byteStart: 23,
        },
      },
      {
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'Tag3',
          },
        ],
        index: {
          byteEnd: 37,
          byteStart: 32,
        },
      },
      {
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'Tag4our',
          },
        ],
        index: {
          byteEnd: 46,
          byteStart: 38,
        },
      },
      {
        features: [
          {
            $type: 'app.bsky.richtext.facet#tag',
            tag: 'tagFivvvve',
          },
        ],
        index: {
          byteEnd: 58,
          byteStart: 47,
        },
      },
    ])
  })
})
