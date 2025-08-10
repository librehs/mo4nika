import { describe, it } from 'mocha'
import { expect } from 'chai'
import { getHashtags } from './utils'

describe('getHashtags', () => {
  it('should parse correct tags', () => {
    expect(
      getHashtags(
        `Debian 13 trixie 发布。

一些新变化：
- 正式支持 64 位小端序 RISC-V (riscv64) 架构。
- i386 外的所有架构现使用 64 位 time_t ABI。
- 一些软件包更新，包括 Emacs 30、GCC 14、LLVM 19、OpenJDK 21 及 KDE 6 等。

https://debian.org/News/2025/20250809

#Debian`,
        [
          {
            offset: 87,
            length: 6,
            type: 'code',
          },
          {
            offset: 159,
            length: 37,
            type: 'url',
          },
          {
            offset: 198,
            length: 7,
            type: 'hashtag',
          },
        ]
      )
    ).to.deep.eq(['Debian'])
  })
})
